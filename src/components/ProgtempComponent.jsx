import React, { PureComponent } from 'react';
import CanvasComponent from './ADAGUC/CanvasComponent';
import { MODEL_LEVEL_URL } from '../constants/default_services';
import axios from 'axios';
import PropTypes from 'prop-types';

export default class ProgtempComponent extends PureComponent {
  constructor () {
    super();
    this.renderProgtempData = this.renderProgtempData.bind(this);
    this.renderProgtempBackground = this.renderProgtempBackground.bind(this);
    this.setModelData = this.setModelData.bind(this);
    this.fetchAndRender = this.fetchAndRender.bind(this);
    this.modifyData = this.modifyData.bind(this);
    this.state = {
      progtempData: null,
      isLoading: false,
      cachedImage: {}
    };
  }
  renderProgtempBackground (ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    if (this.state.cachedImage && this.state.cachedImage.width === w && this.state.cachedImage.height === h) {
      ctx.putImageData(this.state.cachedImage, 0, 0);
    } else {
      // eslint-disable-next-line no-undef
      drawProgtempBg(ctx, w, h);
      const bg = ctx.getImageData(0, 0, w, h);
      if (bg) {
        this.setState({ cachedImage: bg });
      }
      this.width = w;
      this.height = h;
    }
  }

  modifyData (data, referenceTime, timeOffset) {
    if (!data) return {};
    function fetchData (data, referenceTime, timeOffset, name) {
      if (!data) return null;
      let selectedData = data.filter((obj) => obj.name === name)[0].data;
      if (timeOffset in selectedData) {
        selectedData = selectedData[timeOffset];
        let selectedObjs = Object.keys(selectedData).map((key) => parseFloat(selectedData[key][Object.keys(selectedData[key])[0]]));
        return selectedObjs;
      }
      return null;
    }

    function getWindInfo (windX, windY) {
      if (!(windX && windY)) return { windSpeed: null, windDirection: null };
      let toRadians = (deg) => {
        return (deg / 180) * Math.PI;
      };
      let toDegrees = (rad) => {
        return (((rad / Math.PI) * 180) + 360) % 360;
      };

      let windSpeed = [];
      let windDirection = [];
      for (var i = 0; i < windX.length; ++i) {
        windSpeed.push(Math.sqrt(windX[i] * windX[i] + windY[i] * windY[i]));
        windDirection.push(toDegrees(toRadians(270) - Math.atan2(windY[i], windX[i])));
      }
      return { windSpeed, windDirection };
    }

    function computeTwTv (T, Td, pressure) {
      if (!(T && Td && pressure)) {
        return { Tw: null, Tv: null };
      }
      let Tw = [];
      let Tv = [];
      for (var i = 0; i < T.length; ++i) {
        // eslint-disable-next-line no-undef
        Tw = calc_Tw(T[i], Td[i], pressure[i]);
        // eslint-disable-next-line no-undef
        Tv = calc_Tv(T[i], Td[i], pressure[i]);
      }
      return { Tw, Tv };
    }
    const refTimeStr = this.props.referenceTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z';

    let pressureData = fetchData(data, refTimeStr, timeOffset, 'air_pressure__at_ml');
    let airTemp = fetchData(data, refTimeStr, timeOffset, 'air_temperature__at_ml');
    let windXData = fetchData(data, refTimeStr, timeOffset, 'x_wind__at_ml');
    let windYData = fetchData(data, refTimeStr, timeOffset, 'y_wind__at_ml');
    let { windSpeed, windDirection } = getWindInfo(windXData, windYData);
    let dewTemp = fetchData(data, refTimeStr, timeOffset, 'dewpoint_temperature__at_ml');
    let { Tw, Tv } = computeTwTv(airTemp, dewTemp, pressureData);
    return { PSounding: pressureData, TSounding: airTemp, TdSounding: dewTemp, ddSounding: windDirection, ffSounding: windSpeed, TwSounding: Tw, TvSounding: Tv };
  }

  renderProgtempData (ctx, canvasWidth, canvasHeight, progtempTime) {
    if (!this.state.isLoading && ctx) {
      const { PSounding, TSounding, TdSounding, ddSounding, ffSounding, TwSounding, TvSounding } = this.modifyData(this.state.progtempData, this.props.referenceTime, progtempTime);
      // eslint-disable-next-line no-undef
      drawProgtemp(ctx, canvasWidth, canvasHeight, PSounding, TSounding, TdSounding, ddSounding, ffSounding, TwSounding, TvSounding);
      // eslint-disable-next-line no-undef
      plotHodo(ctx, canvasWidth, canvasHeight, PSounding, TSounding, TdSounding, ddSounding, ffSounding, TwSounding);
    }
  }

  setModelData (model, location) {
    let url;
    if (!(model && location && this.props.referenceTime)) return;
    const refTimeStr = this.props.referenceTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    switch (model.toUpperCase()) {
      default:
        url = `${MODEL_LEVEL_URL}SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPointValue&LAYERS=&
QUERY_LAYERS=air_pressure__at_ml,y_wind__at_ml,x_wind__at_ml,dewpoint_temperature__at_ml,air_temperature__at_ml&CRS=EPSG%3A4326&
INFO_FORMAT=application/json&time=*&DIM_reference_time=` + refTimeStr + `&x=` + location.x + `&y=` + location.y + `&DIM_modellevel=*`;
        break;
    }
    return axios.get(url).then((d) => {
      this.setState({ progtempData: d.data });
    });
  }

  fetchAndRender (model, location) {
    if (!(model && location)) return;
    this.setState({ isLoading: true });
    const m = this.setModelData(model, location);
    if (m) {
      m.then(() => {
        this.renderProgtempData(this.progtempContext, this.width, this.height, this.props.time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
        this.setState({ isLoading: false });
      }).catch(() => this.setState({ isLoading: false }));
    }
  }

  componentWillUpdate (nextProps, nextState) {
    if (nextProps.selectedModel !== this.props.selectedModel ||
        nextProps.location !== this.props.location ||
        nextProps.referenceTime !== this.props.referenceTime) {
      this.fetchAndRender(nextProps.selectedModel, nextProps.location);
    } else {
      this.renderProgtempData(this.progtempContext, this.width, this.height, nextProps.time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
    }
  }

  componentDidMount () {
    this.fetchAndRender(this.props.selectedModel, this.props.location);
  }

  render () {
    const { time, className, style } = this.props;
    return (
      <div className={className} style={style}>
        <CanvasComponent onRenderCanvas={(ctx, w, h) => {
          this.width = w;
          this.height = h;
          this.renderProgtempBackground(ctx, w, h);
          this.renderProgtempData(ctx, w, h, time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
        }} />
      </div>);
  }
}

ProgtempComponent.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  time: PropTypes.object,
  selectedModel: PropTypes.string.isRequired,
  referenceTime: PropTypes.object.isRequired,
  location: PropTypes.object
};
