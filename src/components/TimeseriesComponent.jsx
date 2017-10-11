import React, { Component } from 'react';
import { Popover, PopoverTitle, PopoverContent } from 'reactstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import PropTypes from 'prop-types';
import { HARMONIE_URL } from '../constants/default_services';
var moment = require('moment');

export default class TimeseriesComponent extends Component {
  /* istanbul ignore next */
  constructor () {
    super();
    this.state = {
      canvasWidth: 480,
      canvasHeight: 500,
      timeData: []
    };
    this.setChosenLocation = this.setChosenLocation.bind(this);
    this.renderDots = this.renderDots.bind(this);
    this.toggleCanvas = this.toggleCanvas.bind(this);
    this.getLabels = this.getLabels.bind(this);
    this.getUnits = this.getUnits.bind(this);
  }

  /* istanbul ignore next */
  customTooltip (props, labels, units) {
    if (props.payload.length > 0) {
      return (
        <div className='recharts-tooltip-wrapper' style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgb(204, 204, 204)', padding: '0.5rem 1rem 0 1rem' }}>
          <div className='recharts-default-tooltip'>
            <p className='recharts-tooltip-label'>{props.label}</p>
            <ul className='recharts-tooltip-item-list' style={{ paddingLeft: '0.5rem', marginTop: 0, listStyleType: 'none' }}>
              {props.payload.map((pl, i) => <li key={i} className='recharts-tooltip-item' style={{ color: props.payload[i].color }}>{props.payload[i].value.toFixed(2)} {units[i]}</li>)}
            </ul>
          </div>
        </div>);
    } else {
      return <div />;
    }
  }
  setModelData (model, location) {
    let url;
    if (!(model && location && this.props.referenceTime)) return;
    const refTimeStr = this.props.referenceTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    switch (model.toUpperCase()) {
      default:
        url = `${HARMONIE_URL}SERVICE=WMS&&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPointValue&LAYERS=&QUERY_LAYERS=
air_pressure_at_sea_level,wind__at_10m,dew_point_temperature__at_2m,air_temperature__at_2m,precipitation_flux&CRS=EPSG%3A4326&
INFO_FORMAT=application/json&time=*&DIM_reference_time=` + refTimeStr + `&x=` + location.x + `&y=` + location.y;
        break;
    }
    return axios.get(url).then((d) => {
      this.setState({ timeData: this.modifyData(d.data), origData: d.data });
    });
  }

  // Remap the data from GetPointInfo to an object containing the relevant data at a reference time
  // such that it can be directly plotted in a graph.
  /* istanbul ignore next */
  modifyData (data) {
    if (!data) return;
    console.log(data)
    function remap (obj, refTime) {
      let newObj = [];
      Object.keys(obj).map((k) => { newObj.push({ 'date': k, 'value': parseFloat(obj[k][refTime]) }); });
      return newObj;
    }
    function getWindInfo (windX, windY) {
      let toRadians = (deg) => {
        return (deg / 180) * Math.PI;
      };
      let toDegrees = (rad) => {
        return (((rad / Math.PI) * 180) + 360) % 360;
      };

      let windSpeed = [];
      let windDirection = [];
      for (var i = 0; i < windX.length; ++i) {
        windSpeed.push({ 'date': windX[i].date, 'value': Math.sqrt(windX[i].value * windX[i].value + windY[i].value * windY[i].value) });
        windDirection.push({ 'date': windX[i].date, 'value': toDegrees(toRadians(270) - Math.atan2(windY[i].value, windX[i].value)) });
      }
      return { windSpeed, windDirection };
    }
    function getValueForDate (arr, currDate) {
      const obj = arr.filter((o) => o.date === currDate)[0];
      return obj.value;
    }
    const refTimeStr = this.props.referenceTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z';

    const windData = data.filter((d) => d.name === 'wind__at_10m');
    const pressureData = remap(data.filter((d) => d.name === 'air_pressure_at_sea_level')[0].data, refTimeStr);
    const windX = remap(windData.filter((d) => d.standard_name === 'x_wind')[0].data, refTimeStr);
    const windY = remap(windData.filter((d) => d.standard_name === 'y_wind')[0].data, refTimeStr);
    const dewData = remap(data.filter((d) => d.name === 'dew_point_temperature__at_2m')[0].data, refTimeStr);
    const tempData = remap(data.filter((d) => d.name === 'air_temperature__at_2m')[0].data, refTimeStr);
    const rainData = remap(data.filter((d) => d.name === 'precipitation_flux')[0].data, refTimeStr);
    const windDataMapped = getWindInfo(windX, windY);
    const windSpeedData = windDataMapped.windSpeed;

    let returnArr = [];
    const windDirectionData = windDataMapped.windDirection;
    let minPressure, maxPressure;
    for (var i = 0; i < tempData.length; ++i) {
      const currDate = tempData[i].date;
      const airTemp = tempData[i].value;
      const dewTemp = getValueForDate(dewData, currDate);
      const windSpeed = getValueForDate(windSpeedData, currDate);
      const windDirection = getValueForDate(windDirectionData, currDate);
      const rain = getValueForDate(rainData, currDate);
      const pressure = getValueForDate(pressureData, currDate);
      minPressure = Math.min(minPressure, pressure);
      maxPressure = Math.max(maxPressure, pressure);
      returnArr.push({
        'date': moment.utc(tempData[i].date).format('MMM DD HH:mm'),
        'air_temp': airTemp,
        'dew_point_temp': dewTemp,
        'wind_speed': windSpeed,
        'wind_dir': windDirection,
        'precipitation': rain,
        'pressure': pressure
      });
    }
    minPressure = Math.floor(Math.round(minPressure) - 2);
    maxPressure = Math.floor(Math.round(maxPressure) + 2);
    this.setState({ minPressure, maxPressure });
    return returnArr;
  }

  /* istanbul ignore next */
  convertMinSec (loc) {
    function padLeft (nr, n, str) {
      return Array(n - String(nr).length + 1).join(str || '0') + nr;
    }

    const behindComma = (loc - Math.floor(loc));

    const minutes = behindComma * 60;
    const seconds = Math.floor((minutes - Math.floor(minutes)) * 60);

    return Math.floor(loc) + ':' + padLeft(Math.floor(minutes), 2, '0') + ':' + padLeft(seconds, 2, '0');
  }
  /* istanbul ignore next */
  setChosenLocation (loc) {
    this.props.dispatch(this.props.adagucActions.setCursorLocation(loc[0]));
  }
  /* istanbul ignore next */
  toggleCanvas () {
    var canvas = this.refs.canvasLoadingOverlay;
    const attribute = canvas.getAttribute('class');
    if (!attribute || attribute === 'canvasLoadingOverlay timeOverlay') {
      canvas.setAttribute('class', 'canvasLoadingOverlay timeOverlay canvasDisabled');
    } else {
      canvas.setAttribute('class', 'canvasLoadingOverlay timeOverlay');
    }
  }
  /* istanbul ignore next */
  renderDots (props) {
    const { cx, cy, stroke, key } = props;
    if (cx === +cx && cy === +cy) {
      const dotDate = moment.utc(props.payload.date, 'MMM DD HH:mm');
      const adagucDate = moment.utc(this.props.time);
      if (dotDate.hour() === adagucDate.hour() && dotDate.day() === adagucDate.day() && dotDate.month() === adagucDate.month() && dotDate.year() === adagucDate.year()) {
        return <circle cx={cx} cy={cy} r={3} stroke={stroke} fill={stroke} key={key} />;
      } else {
        return <circle cx={cx} cy={cy} r={3} stroke={stroke} fill='#ffffff' key={key} />;
      }
    }

    return null;
  }
  /* istanbul ignore next */
  getLabels (data) {
    let retData = [];
    data.map((d) => {
      let mappedName = '';
      switch (d) {
        case 'pressure':
          mappedName = 'Air pressure';
          break;
        case 'dew_point_temp':
          mappedName = 'Dew point';
          break;
        case 'wind_speed':
          mappedName = 'Wind speed';
          break;
        case 'wind_dir':
          mappedName = 'Wind direction';
          break;
        case 'air_temp':
          mappedName = 'Air temperature';
          break;
        case 'precipitation':
          mappedName = 'Precipitation';
          break;
      }
      retData.push(mappedName);
    });
    return retData;
  }

  /* istanbul ignore next */
  getUnits (data) {
    let retData = [];
    data.map((d) => {
      let dataUnit = this.state.origData.filter((td) => td.name.includes(d));
      if (dataUnit.length === 0) {
        dataUnit = this.state.origData.filter((td) => td.name.includes(d.split('_')[0]));
      }
      dataUnit = dataUnit[0].units;
      switch (dataUnit) {
        case 'Celsius':
          retData.push('℃');
          break;
        default:
          retData.push(dataUnit);
          break;
      }
    });
    return retData;
  }
  fetchAndRender (model, location) {
    if (!(model && location)) return;
    this.setState({ isLoading: true });
    this.setModelData(model, location).then(() => {
      this.renderProgtempData(this.progtempContext, this.width, this.height, this.props.time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
      this.setState({ isLoading: false });
    }).catch(() => this.setState({ isLoading: false }));
  }

  componentWillUpdate (nextProps, nextState) {
    if (nextProps.selectedModel !== this.props.selectedModel ||
        nextProps.location !== this.props.location ||
        nextProps.referenceTime !== this.props.referenceTime) {
      this.fetchAndRender(nextProps.selectedModel, nextProps.location);
    }
  }
  /* istanbul ignore next */
  render () {
    const { location, time, className, style } = this.props;
    const maxWidth = this.state.canvasWidth + 'px';
    const maxHeight = this.state.canvasHeight + 'px';
    console.log(this.state);
    return (
      <div className={className} style={style}>
        {this.state.timeData.length > 0
          ? <div>
            <LineChart width={this.state.canvasWidth} height={this.state.canvasHeight / 4.0} data={this.state.timeData}
              margin={{ top: 0, left: 0, right: 10, bottom: 10 }}>
              <XAxis dataKey='date' />
              <YAxis />
              <Legend margin={{ top: 0 }} verticalAlign='top' payload={[ { type: 'line', value: this.getLabels(['air_temp']), color: '#ff0000' },
                { type: 'line', value: this.getLabels(['dew_point_temp']), color: '#0000ff' } ]} />
              <Tooltip content={(props) => this.customTooltip(props, this.getLabels(['air_temp', 'dew_point_temp']), this.getUnits(['air_temp', 'dew_point_temp']))} />
              <CartesianGrid stroke='#f5f5f5' />
              <Line type='monotone' dataKey='air_temp' stroke='#ff0000' dot={this.renderDots} />
              <Line type='monotone' dataKey='dew_point_temp' stroke='#0000ff' dot={this.renderDots} />
            </LineChart>
            <LineChart width={this.state.canvasWidth} height={this.state.canvasHeight / 4.0} data={this.state.timeData}
              margin={{ top: 0, left: 0, right: 10, bottom: 10 }}>
              <XAxis dataKey='date' />
              <YAxis domain={[0, 360]} />
              <Legend margin={{ top: 0 }} verticalAlign='top' payload={[ { type: 'line', value: this.getLabels(['wind_dir']), color: '#ff7300' } ]} />
              <Tooltip content={(props) => this.customTooltip(props, this.getLabels(['wind_dir']), '°')} />
              <CartesianGrid stroke='#f5f5f5' />
              <Line type='monotone' dataKey='wind_dir' stroke='#ff7300' dot={this.renderDots} />
            </LineChart>
            <LineChart width={this.state.canvasWidth} height={this.state.canvasHeight / 4.0} data={this.state.timeData}
              margin={{ top: 0, left: 0, right: 10, bottom: 10 }}>
              <XAxis dataKey='date' />
              <YAxis />
              <Legend margin={{ top: 0 }} verticalAlign='top' payload={[ { type: 'line', value: this.getLabels(['wind_speed']), color: '#ff7300' } ]} />
              <Tooltip content={(props) => this.customTooltip(props, this.getLabels(['wind_speed']), this.getUnits(['wind_speed']))} />
              <CartesianGrid stroke='#f5f5f5' />
              <Line type='monotone' dataKey='wind_speed' stroke='#ff7300' dot={this.renderDots} />
            </LineChart>
            <LineChart width={this.state.canvasWidth} height={this.state.canvasHeight / 4.0} data={this.state.timeData}
              margin={{ top: 0, left: 0, right: 10, bottom: 10 }}>
              <XAxis dataKey='date' />
              <YAxis />
              <Legend margin={{ top: 0 }} verticalAlign='top' payload={[ { type: 'line', value: this.getLabels(['precipitation']), color: '#ff7300' } ]} />
              <Tooltip content={(props) => this.customTooltip(props, this.getLabels(['precipitation']), this.getUnits(['precipitation']))} />
              <CartesianGrid stroke='#f5f5f5' />
              <Line type='monotone' dataKey='precipitation' stroke='#ff7300' dot={this.renderDots} />
            </LineChart>
            <LineChart width={this.state.canvasWidth} height={this.state.canvasHeight / 4.0} data={this.state.timeData}
              margin={{ top: 0, left: 0, right: 10, bottom: 10 }}>
              <XAxis dataKey='date' />
              <YAxis domain={['auto', 'auto']} />
              <Legend margin={{ top: 0 }} verticalAlign='top' payload={[ { type: 'line', value: this.getLabels(['pressure']), color: '#ff7300' } ]} />
              <Tooltip content={(props) => this.customTooltip(props, this.getLabels(['pressure']), this.getUnits(['pressure']))} />
              <CartesianGrid stroke='#f5f5f5' />
              <Line type='monotone' dataKey='pressure' stroke='#ff7300' dot={this.renderDots} />
            </LineChart>
          </div>
          : <div style={{ width: maxWidth, height: maxHeight }} />
        }
      </div>);
  }
}
TimeseriesComponent.propTypes = {
  adagucProperties: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
  adagucActions: PropTypes.object.isRequired
};
