import React from 'react';
import { default as Menu } from './Menu';
import TimeComponent from './TimeComponent.js';

export default class Adaguc extends React.Component {
  constructor () {
    super();
    this.initAdaguc = this.initAdaguc.bind(this);
    this.animateLayer = this.animateLayer.bind(this);
    this.resize = this.resize.bind(this);
    this.updateAnimation = this.updateAnimation.bind(this);
  }
  currentLatestDate = undefined;
  currentBeginDate = undefined;

  updateAnimation (layer) {

    var timeDim = layer.getDimension('time');
    var numTimeSteps = timeDim.size();

    var numStepsBack = Math.min(timeDim.size(), 25);
    this.currentLatestDate = timeDim.getValueForIndex(numTimeSteps - 1);
    this.currentBeginDate = timeDim.getValueForIndex(numTimeSteps - numStepsBack);

    var dates = [];
    for (var j = numTimeSteps - numStepsBack; j < numTimeSteps; ++j) {
      dates.push({ name:timeDim.name, value:timeDim.getValueForIndex(j) });
    }
    //is.webMapJS.draw();
    //this.webMapJS.setDimension('time',dates[dates.length-1].value);
    this.webMapJS.draw(dates);
    setTimeout(function () { layer.parseLayer(this.updateAnimation, true); }, 10000);
  }

  animateLayer (layer) {
    this.webMapJS.setAnimationDelay(200);
    this.updateAnimation(layer);
    layer.onReady = undefined;
  }

  resize () {
    // eslint-disable-next-line no-use-before-define
    this.webMapJS.setSize($(window).width() - 200, $(window).height() - 150);
    this.webMapJS.draw();
  }

  initAdaguc (elem) {
    const { adagucProperties, createMap } = this.props;
    if (adagucProperties.mapCreated) {
      return;
    }
    var username = 'terpstra';
    var url = ['http://localhost/~', username, '/adagucviewer/webmapjs'].join('');
    this.webMapJS = new WMJSMap(document.getElementById('adaguc'));
    this.webMapJS.setBaseURL(url);
    $(window).resize(this.resize);
    this.webMapJS.setSize($(window).width() - 200, $(window).height() - 150);

    // Set the initial projection
    this.webMapJS.setProjection(adagucProperties.projectionName);
    this.webMapJS.setBBOX(adagucProperties.boundingBox.join());
    this.webMapJS.setBaseLayers([new WMJSLayer(adagucProperties.mapType)]);
    createMap();
  }
  componentWillUnmount () {
    if (this.webMapJS) {
      this.webMapJS.destroy();
    }
  }
  componentDidUpdate (prevProps, prevState) {
    // The first time, the map needs to be created. This is when in the previous state the map creation boolean is false
    // Otherwise only change when a new dataset is selected
    var { layer, mapType, boundingBox } = this.props.adagucProperties;
    // if (!prevProps.adagucProperties.mapCreated || layer !== prevProps.adagucProperties.layer) {
    if (mapType !== prevProps.adagucProperties.mapType) {
      this.webMapJS.setBaseLayers([new WMJSLayer(mapType)]);
    } else if (boundingBox !== prevProps.adagucProperties.boundingBox) {
      this.webMapJS.setBBOX(boundingBox.join());
    } else {
      var newDataLayer = new WMJSLayer(layer);
      // Stop the old animation
      this.webMapJS.stopAnimating();
      // Start the animation of th new layer
      newDataLayer.onReady = this.animateLayer;
      // Remove all present layers
      this.webMapJS.removeAllLayers();
      // And add the new layer
      this.webMapJS.addLayer(newDataLayer);
      this.webMapJS.setActiveLayer(newDataLayer);
      // console.log('switched layers');
    }
  };

  render () {
    return (<div>
      <span id='adaguccontainer'>
        <div id='adaguc' ref={(elem) => { this.initAdaguc(elem); }} />
      </span>
      <Menu {...this.props} />
      <TimeComponent webmapjs={this.webMapJS} onChange={this.change} />
      </div>);
  }
};

Adaguc.propTypes = {
  adagucProperties : React.PropTypes.object.isRequired,
  createMap        : React.PropTypes.func.isRequired,
  setData          : React.PropTypes.func.isRequired,
  setMapStyle      : React.PropTypes.func.isRequired,
  setCut           : React.PropTypes.func.isRequired
};