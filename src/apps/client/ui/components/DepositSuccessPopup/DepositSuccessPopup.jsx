import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import classNames from 'classnames';

import styles from './DepositSuccessPopup.css';

import propOr from '@tinkoff/utils/object/propOr';

import outsideClick from '../../hocs/outsideClick.jsx';

import setDepositSuccessPopup from '../../../actions/setDepositSuccessPopup.js';
import setAccountInfoPopup from '../../../actions/setAccountInfoPopup.js';

const mapStateToProps = ({application}) => {
    return {
        langMap: application.langMap,
    };
};

const mapDispatchToProps = (dispatch) => ({
    setDepositSuccessPopup: (payload) => dispatch(setDepositSuccessPopup(payload)),
    setAccountInfoPopup: (payload) => dispatch(setAccountInfoPopup(payload)),
});

@outsideClick
class DepositSuccessPopup extends Component {
    static propTypes = {
        langMap: PropTypes.object.isRequired,
        isVisible: PropTypes.bool,
        amount: PropTypes.string.isRequired,
        turnOnClickOutside: PropTypes.func.isRequired,
        outsideClickEnabled: PropTypes.bool,
        setDepositSuccessPopup: PropTypes.func.isRequired,
        setAccountInfoPopup: PropTypes.func.isRequired,
    };

    componentDidUpdate(prevProps) {
        const {outsideClickEnabled} = this.props;

        if (
            this.props.isVisible !== prevProps.isVisible &&
            this.props.isVisible &&
            !outsideClickEnabled
        ) {
            this.props.turnOnClickOutside(this, this.handleSetDepositSuccessPopup);
        }
    }

    handleOutsideClick = () => {
        this.props.turnOnClickOutside(this, this.handleSetDepositSuccessPopup);
    };

    handleSetDepositSuccessPopup = () => {
        this.props.setDepositSuccessPopup(false);
        this.props.setAccountInfoPopup(false);
    };

    render() {
        const {langMap, isVisible, amount} = this.props;
        const text = propOr('depositSuccess', {}, langMap);

        return (
            <div
                onClick={this.handleOutsideClick}
                className={classNames(styles.root, {
                    [styles.isVisible]: isVisible,
                })}
            >
                <div className={styles.cover} />
                <div className={styles.popupWrap}>
                    <div className={styles.popup}>
                        <div className={styles.popupContent}>
                            <div className={styles.content}>
                                <div className={styles.topTitle}>
                                    {text.topTitle}
                                    {amount}
                                    <br />
                                    <span>{text.success}</span> {text.sended}
                                </div>
                                <div className={styles.bottomTitle}>{text.bottomTitle}</div>
                                <img src="/src/apps/client/ui/components/WithdrawSuccessPopup/images/tick.svg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DepositSuccessPopup);
