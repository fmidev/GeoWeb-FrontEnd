import React, { PureComponent } from 'react';
import { Col, Row, Badge, Card, CardHeader, CardBody } from 'reactstrap';
import CollapseOmni from '../../components/CollapseOmni';
import Icon from 'react-fa';
import PropTypes from 'prop-types';
import { SIGMET_MODES, CATEGORY_REFS, READ_ABILITIES } from '../../containers/Sigmet/SigmetActions';
import { SIGMET_VARIANTS_PREFIXES, PHENOMENON_CODE_VOLCANIC_ASH, SIGMET_TYPES } from './SigmetTemplates';
import SigmetEditMode from './SigmetEditMode';
import SigmetReadMode from './SigmetReadMode';
import SigmetMinifiedMode from './SigmetMinifiedMode';

class SigmetsCategory extends PureComponent {
  byStartAndSequence (sigA, sigB) {
    // By valid period start (DESC) and sequence number (DESC)
    const startA = sigA.hasOwnProperty('validdate') && sigA.validdate;
    const startB = sigB.hasOwnProperty('validdate') && sigB.validdate;
    const seqA = sigA.hasOwnProperty('sequence') && sigA.sequence;
    const seqB = sigB.hasOwnProperty('sequence') && sigB.sequence;
    if (startA) {
      if (startB) {
        if (startA < startB) {
          return 1;
        }
        if (startB < startA) {
          return -1;
        }
        if (!isNaN(seqA) && !isNaN(seqB)) {
          return seqB - seqA;
        }
        return 0;
      } else {
        return 1;
      }
    } else if (startB) {
      return -1;
    }
    if (!isNaN(seqA) && !isNaN(seqB)) {
      return seqB - seqA;
    }
    return 0;
  }

  render () {
    const { typeRef, title, icon, sigmets, selectedSigmet, selectedAuxiliaryInfo, geojson, copiedSigmetRef, tacs, isOpen, dispatch, actions, abilities,
      phenomena, parameters, displayModal, hasStartCoordinates, hasStartIntersectionCoordinates, hasEndCoordinates, hasEndIntersectionCoordinates } = this.props;
    const maxSize = 10000; // for now, arbitrairy big
    const itemLimit = 25;
    const isOpenable = (isOpen || (!isOpen && sigmets.length > 0));
    return <Card className={`SigmetsCategory row accordion${isOpen ? ' open' : ''}${isOpenable ? ' openable' : ''}`}>
      <Col>
        <CardHeader className='row' title={title} onClick={isOpenable ? (evt) => dispatch(actions.toggleCategoryAction(evt, typeRef)) : null}>
          <Col xs='auto'>
            <Icon name={icon} />
          </Col>
          <Col>
            {title}
          </Col>
          <Col xs='auto'>
            {sigmets.length > 0
              ? (sigmets.length === 1 && typeRef === CATEGORY_REFS.ADD_SIGMET)
                ? <Badge color='danger' pill><Icon name='plus' /></Badge>
                : <Badge color='danger' pill>{sigmets.length}</Badge>
              : null
            }
          </Col>
        </CardHeader>
        {isOpen
          ? <Row>
            <CollapseOmni className='CollapseOmni col' isOpen={isOpen} minSize={0} maxSize={maxSize}>
              <CardBody>
                <Row>
                  <Col className='btn-group-vertical'>
                    {sigmets.slice().sort(this.byStartAndSequence).slice(0, itemLimit).map((sigmet, index) => {
                      const isSelectedSigmet = selectedSigmet && sigmet.uuid === selectedSigmet.uuid;
                      const sigmetToShow = isSelectedSigmet ? selectedSigmet : sigmet;
                      const isCancelFor = sigmetToShow.cancels !== null && !isNaN(sigmetToShow.cancels)
                        ? parseInt(sigmetToShow.cancels)
                        : null;
                      const isVolcanicAsh = sigmetToShow.phenomenon ? sigmetToShow.phenomenon === PHENOMENON_CODE_VOLCANIC_ASH : false;
                      const isTropicalCyclone = false;
                      const prefix = isVolcanicAsh
                        ? SIGMET_VARIANTS_PREFIXES.VOLCANIC_ASH
                        : isTropicalCyclone
                          ? SIGMET_VARIANTS_PREFIXES.TROPICAL_CYCLONE
                          : SIGMET_VARIANTS_PREFIXES.NORMAL;
                      const activeFirEntry = Object.entries(parameters.firareas).filter((entry) => entry[1].firname === sigmetToShow.firname &&
                          entry[1].location_indicator_icao === sigmetToShow.location_indicator_icao);
                      const activeFir = Array.isArray(activeFirEntry) && activeFirEntry.length === 1
                        ? activeFirEntry[0][1]
                        : null;
                      const availableFirs = parameters.active_firs.map((firKey) => parameters.firareas[firKey]);
                      const availablePhenomena = phenomena.slice().sort((phA, phB) => {
                        const nameA = phA.name.toUpperCase();
                        const nameB = phB.name.toUpperCase();
                        return nameA < nameB
                          ? -1
                          : nameA > nameB
                            ? 1
                            : 0;
                      });
                      const maxHoursInAdvance = activeFir
                        ? activeFir[`${prefix}hoursbeforevalidity`]
                        : null;
                      const maxHoursDuration = activeFir
                        ? activeFir[`${prefix}maxhoursofvalidity`]
                        : null;
                      const adjacentFirs = activeFir
                        ? activeFir['adjacent_firs']
                        : null;
                      const volcanoCoordinates = Array.isArray(sigmetToShow.va_extra_fields.volcano.position) && sigmetToShow.va_extra_fields.volcano.position.length > 1
                        ? sigmetToShow.va_extra_fields.volcano.position
                        : [null, null];

                      // Render selected SIGMET
                      if (isSelectedSigmet) {
                        const SigmetComponent = selectedAuxiliaryInfo.mode === SIGMET_MODES.EDIT ? SigmetEditMode : SigmetReadMode;
                        return <SigmetComponent key={`SIGMET-${sigmetToShow.uuid}`}
                          dispatch={dispatch}
                          actions={actions}
                          abilities={abilities[selectedAuxiliaryInfo.mode]}
                          copiedSigmetRef={copiedSigmetRef}
                          hasEdits={selectedAuxiliaryInfo.hasEdits}
                          isVolcanicAsh={isVolcanicAsh}
                          availablePhenomena={availablePhenomena}
                          phenomenon={sigmetToShow.phenomenon}
                          volcanoName={sigmetToShow.va_extra_fields.volcano.name || null}
                          volcanoCoordinates={volcanoCoordinates}
                          isNoVolcanicAshExpected={sigmetToShow.va_extra_fields.no_va_expected}
                          focus
                          uuid={sigmetToShow.uuid}
                          distributionType={sigmetToShow.type}
                          sigmet={sigmetToShow}
                          geojson={geojson}
                          obsFcTime={sigmetToShow.obs_or_forecast ? sigmetToShow.obs_or_forecast.obsFcTime : null}
                          validdate={sigmetToShow.validdate}
                          validdateEnd={sigmetToShow.validdate_end}
                          issuedate={sigmetToShow.issuedate}
                          sequence={sigmetToShow.sequence}
                          firname={sigmetToShow.firname}
                          locationIndicatorIcao={sigmetToShow.location_indicator_icao}
                          locationIndicatorMwo={sigmetToShow.location_indicator_mwo}
                          levelinfo={sigmetToShow.levelinfo}
                          movementType={sigmetToShow.movement_type}
                          movement={sigmetToShow.movement}
                          change={sigmetToShow.change}
                          isObserved={sigmetToShow.obs_or_forecast ? sigmetToShow.obs_or_forecast.obs : null}
                          drawModeStart={selectedAuxiliaryInfo.drawModeStart}
                          drawModeEnd={selectedAuxiliaryInfo.drawModeEnd}
                          feedbackStart={selectedAuxiliaryInfo.feedbackStart}
                          feedbackEnd={selectedAuxiliaryInfo.feedbackEnd}
                          hasStartCoordinates={hasStartCoordinates}
                          hasStartIntersectionCoordinates={hasStartIntersectionCoordinates}
                          hasEndCoordinates={hasEndCoordinates}
                          hasEndIntersectionCoordinates={hasEndIntersectionCoordinates}
                          availableFirs={availableFirs}
                          maxHoursInAdvance={maxHoursInAdvance}
                          maxHoursDuration={maxHoursDuration}
                          isCancelFor={isCancelFor}
                          displayModal={displayModal}
                          adjacentFirs={adjacentFirs}
                          moveTo={sigmetToShow.va_extra_fields.move_to}
                          tac={tacs && tacs.find((tac) => tac.uuid === selectedSigmet.uuid)}
                        />;
                      }

                      // Render not selected SIGMET
                      return <SigmetMinifiedMode key={`SIGMET-${sigmetToShow.uuid}`}
                        dispatch={dispatch}
                        actions={actions}
                        uuid={sigmetToShow.uuid}
                        distributionType={sigmetToShow.type}
                        tac={tacs && tacs.find((tac) => tac.uuid === sigmetToShow.uuid)}
                        phenomenon={sigmetToShow.phenomenon}
                        validdate={sigmetToShow.validdate}
                        validdateEnd={sigmetToShow.validdate_end}
                        isCancelFor={isCancelFor}
                      />;
                    })}
                  </Col>
                </Row>
              </CardBody>
            </CollapseOmni>
          </Row>
          : null
        }
      </Col>
    </Card>;
  }
}

const abilitiesPropTypes = {};
Object.values(READ_ABILITIES).map(ability => {
  abilitiesPropTypes[ability.check] = PropTypes.bool;
});

SigmetsCategory.propTypes = {
  typeRef: PropTypes.oneOf(Object.values(CATEGORY_REFS)),
  title: PropTypes.string,
  icon: PropTypes.string,
  sigmets: PropTypes.arrayOf(SIGMET_TYPES.SIGMET),
  selectedSigmet: SIGMET_TYPES.SIGMET,
  selectedAuxiliaryInfo: SIGMET_TYPES.AUXILIARY_INFO,
  phenomena: PropTypes.array,
  isOpen: PropTypes.bool,
  abilities: PropTypes.shape(abilitiesPropTypes),
  dispatch: PropTypes.func,
  actions: PropTypes.shape({
    toggleCategoryAction: PropTypes.func
  }),
  hasStartCoordinates: PropTypes.bool,
  hasStartIntersectionCoordinates: PropTypes.bool,
  hasEndCoordinates: PropTypes.bool,
  hasEndIntersectionCoordinates: PropTypes.bool,
  parameters: PropTypes.shape({
    firareas: PropTypes.object,
    active_firs: PropTypes.array
  }),
  tacs: PropTypes.arrayOf(PropTypes.shape({
    uuid: PropTypes.string,
    code: PropTypes.string
  })),
  copiedSigmetRef: PropTypes.string,
  geojson: PropTypes.object,
  displayModal: PropTypes.string
};

export default SigmetsCategory;
