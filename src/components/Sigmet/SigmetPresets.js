import { BOUNDING_BOXES } from '../constants/bounding_boxes';
import { GetServiceByName } from '../utils/getServiceByName';

const sigmetLayers = (p) => {
  const HARMONIE_URL = GetServiceByName(this.props.sources, 'Harmonie36');
  const OVERLAY_URL = GetServiceByName(this.props.sources, 'OVL');
  const OBSERVATIONS_URL = GetServiceByName(this.props.sources, 'OBS');
  const RADAR_URL = GetServiceByName(this.props.sources, 'RADAR');
  const LIGHTNING_URL = GetServiceByName(this.props.sources, 'LGT');
  const SATELLITE_URL = GetServiceByName(this.props.sources, 'SAT');
  const HARMONIE_ML_URL = GetServiceByName(this.props.sources, 'Harmonie36');
  switch (p) {
    case 'sigmet_layer_TS':
      return (
        {
          area: {
            bottom: BOUNDING_BOXES[1].bbox[1],
            top: BOUNDING_BOXES[1].bbox[3],
            crs: 'EPSG:3857'
          },
          display: {
            npanels: 4,
            type: 'quaduneven'
          },
          panelsProperties: [
            [
              {
                service: HARMONIE_URL,
                title: 'Harmonie36',
                name: 'precipitation_flux',
                label: 'Prec: Precipitation rate',
                opacity: 1,
                enabled: true,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ],
            [
              {
                service: OBSERVATIONS_URL,
                title: 'OBS',
                name: '10M/ww',
                label: 'wawa Weather Code (ww)',
                enabled: true,
                opacity: 1,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ],
            [
              {
                service: RADAR_URL,
                title: 'RADAR',
                name: 'precipitation',
                label: 'Neerslag',
                opacity: 1,
                enabled: true,
                overlay: false
              }, {
                service: LIGHTNING_URL,
                title: 'LGT',
                name: 'LGT_NL25_LAM_05M',
                label: 'LGT_NL25_LAM_05M',
                enabled: true,
                opacity: 1,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ],
            [
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ]
          ]
        }
      );

    case 'sigmet_layer_SEV_TURB':
      return (
        {
          area: {
            bottom: BOUNDING_BOXES[1].bbox[1],
            top: BOUNDING_BOXES[1].bbox[3],
            crs: 'EPSG:3857'
          },
          display: {
            npanels: 4,
            type: 'quaduneven'
          },
          panelsProperties: [
            [
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                overlay: true
              },
              {
                service: HARMONIE_ML_URL,
                title: 'ADAGUC WMS Service for Geoweb',
                name: 'wind__at_ml',
                label: 'Wind flags (ML)',
                opacity: 1,
                enabled: true,
                modellevel: 17,
                style: 'Windbarbs_mps/barbshaded',
                styleTitle: 'Wind barbs+sh',
                overlay: false
              }
            ], [], [],
            [
              {
                service: OBSERVATIONS_URL,
                title: 'OBS',
                name: '10M/derived/windforce',
                label: 'Wind force',
                opacity: 1,
                enabled: true,
                style: 'bftalldiscvec/barb',
                styleTitle: 'bftalldiscvec/barb',
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                overlay: true
              }
            ]
          ]
        }
      );
    case 'sigmet_layer_SEV_ICE':
      return (
        {
          area: {
            bottom: BOUNDING_BOXES[1].bbox[1],
            top: BOUNDING_BOXES[1].bbox[3],
            crs: 'EPSG:3857'
          },
          display: {
            npanels: 4,
            type: 'quaduneven'
          },
          panelsProperties: [
            [
              {
                service: SATELLITE_URL,
                title: 'SAT',
                name: 'HRVIS',
                label: 'HRVIS',
                opacity: 1,
                enabled: true,
                overlay: false
              },
              {
                service: RADAR_URL,
                title: 'RADAR',
                name: 'precipitation_eur',
                label: 'Neerslag EUR',
                opacity: 1,
                overlay: false
              }
            ], [], [],
            [
              {
                service: OBSERVATIONS_URL,
                title: 'OBS',
                name: '10M/td',
                label: 'Dew Point Temperature 1.5m 1 Min Average (td)',
                opacity: 1,
                enabled: true,
                style: 'auto/nearest',
                styleTitle: 'auto/nearest',
                overlay: false
              },
              {
                service: OBSERVATIONS_URL,
                title: 'OBS',
                name: '10M/ta',
                label: 'Air Temperature 1 Min Average (ta)',
                opacity: 1,
                enabled: true,
                style: 'temperaturedisc/point',
                styleTitle: 'temperaturedisc/point',
                overlay: false
              }
            ]
          ]
        }
      );

    default:
      return (
        {
          area: {
            bottom: BOUNDING_BOXES[1].bbox[1],
            top: BOUNDING_BOXES[1].bbox[3],
            crs: 'EPSG:3857'
          },
          display: {
            npanels: 4,
            type: 'quaduneven'
          },
          panelsProperties: [
            [
              {
                service: HARMONIE_URL,
                title: 'Harmonie36',
                name: 'precipitation_flux',
                label: 'Prec: Precipitation rate',
                opacity: 1,
                enabled: true,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ],
            [
              {
                service: OBSERVATIONS_URL,
                title: 'OBS',
                name: '10M/ww',
                label: 'wawa Weather Code (ww)',
                enabled: true,
                opacity: 1,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ],
            [
              {
                service: RADAR_URL,
                title: 'RADAR',
                name: 'precipitation',
                label: 'Neerslag',
                opacity: 1,
                enabled: true,
                overlay: false
              }, {
                service: LIGHTNING_URL,
                title: 'LGT',
                name: 'LGT_NL25_LAM_05M',
                label: 'LGT_NL25_LAM_05M',
                enabled: true,
                opacity: 1,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ],
            [
              {
                service: SATELLITE_URL,
                title: 'SAT',
                name: 'HRVCOMB',
                label: 'RGBHRVCOMB',
                enabled: true,
                opacity: 1,
                overlay: false
              },
              {
                service: OVERLAY_URL,
                title: 'OVL',
                name: 'FIR_DEC_2013_EU',
                label: 'FIR areas',
                enabled: true,
                overlay: true
              }
            ]
          ]
        }
      );
  }
};

module.exports = {
  sigmetLayers: sigmetLayers
};
