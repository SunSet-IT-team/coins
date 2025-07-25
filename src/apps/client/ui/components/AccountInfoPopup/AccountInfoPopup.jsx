import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import classNames from 'classnames';

import styles from './AccountInfoPopup.css';

import propOr from '@tinkoff/utils/object/propOr';

import setAccountInfoPopup from '../../../actions/setAccountInfoPopup';

import outsideClick from '../../hocs/outsideClick.jsx';
import DocumentInfoPopup from '../DocumentInfoPopup/DocumentInfoPopup';
import TransactionInfoPopup from '../TransactionInfoPopup/TransactionInfoPopup';
import TradeHistoryInfoPopup from '../TradeHistoryInfoPopup/TradeHistoryInfoPopup';
import PrivateDataFormPopup from '../PrivateDataFormPopup/PrivateDataFormPopup';

const mapStateToProps = ({application}) => {
    return {
        langMap: application.langMap,
        mediaWidth: application.media.width,
    };
};

const mapDispatchToProps = (dispatch) => ({
    setAccountInfoPopup: (payload) => dispatch(setAccountInfoPopup(payload)),
});

@outsideClick
class AccountInfoPopup extends Component {
    static propTypes = {
        langMap: PropTypes.object.isRequired,
        setAccountInfoPopup: PropTypes.func,
        isVisible: PropTypes.bool,
        turnOnClickOutside: PropTypes.func.isRequired,
        outsideClickEnabled: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        this.state = {
            activeSlide: 1,
        };
    }

    formsSliderContainerRef = React.createRef();
    navbarRef = React.createRef();

    componentDidUpdate(prevProps) {
        const {outsideClickEnabled} = this.props;

        if (this.props.isVisible !== prevProps.isVisible && !outsideClickEnabled) {
            this.props.turnOnClickOutside(this, this.closePopup);
        }
    }

    handleOutsideClick = () => {
        this.props.turnOnClickOutside(this, this.closePopup);
    };

    closePopup = () => {
        this.props.setAccountInfoPopup(false);
        setTimeout(this.handleTitleClick(1), 300);
    };

    handleFormPopupClose = () => {
        this.setState({isSubmitted: false});
    };

    handleTitleClick = (index) => () => {
        const width = this.navbarRef.current.offsetWidth;
        let currentLeft = -(index - 1) * width;
        this.formsSliderContainerRef.current.style.marginLeft = currentLeft + 'px';

        this.setState({
            activeSlide: index,
        });
    };

    render() {
        const {langMap, isVisible} = this.props;
        const {activeSlide} = this.state;
        const text = propOr('accountInfo', {}, langMap);

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
                            <div className={classNames(styles.content)}>
                                <button
                                    className={classNames(styles.closeButton)}
                                    onClick={this.closePopup}
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {/* eslint-disable-next-line max-len */}
                                        <path
                                            d="M12 1.05L10.95 0L6 4.95L1.05 0L0 1.05L4.95 6L0 10.95L1.05 12L6 7.05L10.95 12L12 10.95L7.05 6L12 1.05Z"
                                            fill="#F8F8F8"
                                        />
                                    </svg>
                                </button>
                                <div ref={this.navbarRef} className={styles.navbar}>
                                    <div
                                        onClick={this.handleTitleClick(1)}
                                        className={classNames(styles.privateData, {
                                            [styles.activeButton]: activeSlide === 1,
                                        })}
                                    >
                                        {text.navbar.privateData}
                                    </div>
                                    <div
                                        onClick={this.handleTitleClick(2)}
                                        className={classNames(styles.documents, {
                                            [styles.activeButton]: activeSlide === 2,
                                        })}
                                    >
                                        {text.navbar.documents}
                                    </div>
                                    <div
                                        onClick={this.handleTitleClick(3)}
                                        className={classNames(styles.transaction, {
                                            [styles.activeButton]: activeSlide === 3,
                                        })}
                                    >
                                        {text.navbar.transaction}
                                    </div>
                                    <div
                                        onClick={this.handleTitleClick(4)}
                                        className={classNames(styles.tradeHistory, {
                                            [styles.activeButton]: activeSlide === 4,
                                        })}
                                    >
                                        {text.navbar.tradeHistory}
                                        {/* eslint-disable-next-line max-len */}
                                        <svg
                                            className={styles.tradeIcon}
                                            width="18"
                                            height="18"
                                            viewBox="0 0 18 18"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            {/* eslint-disable-next-line max-len */}
                                            <path
                                                d="M8.85234 12.4922C8.86988 12.5146 8.89229 12.5327 8.91788 12.5452C8.94346 12.5577 8.97154 12.5641 9 12.5641C9.02846 12.5641 9.05654 12.5577 9.08212 12.5452C9.10771 12.5327 9.13012 12.5146 9.14766 12.4922L11.7727 9.17109C11.8687 9.04922 11.782 8.86875 11.625 8.86875H9.88828V0.9375C9.88828 0.834375 9.80391 0.75 9.70078 0.75H8.29453C8.19141 0.75 8.10703 0.834375 8.10703 0.9375V8.86641H6.375C6.21797 8.86641 6.13125 9.04688 6.22734 9.16875L8.85234 12.4922ZM17.5781 11.6719H16.1719C16.0688 11.6719 15.9844 11.7563 15.9844 11.8594V15.4688H2.01562V11.8594C2.01562 11.7563 1.93125 11.6719 1.82812 11.6719H0.421875C0.31875 11.6719 0.234375 11.7563 0.234375 11.8594V16.5C0.234375 16.9148 0.569531 17.25 0.984375 17.25H17.0156C17.4305 17.25 17.7656 16.9148 17.7656 16.5V11.8594C17.7656 11.7563 17.6812 11.6719 17.5781 11.6719Z"
                                                fill="#A6B1DC"
                                                fillOpacity="0.5"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div
                                    ref={this.formsSliderContainerRef}
                                    className={styles.formsContainer}
                                >
                                    <PrivateDataFormPopup isVisible={isVisible} />
                                    <DocumentInfoPopup />
                                    <TransactionInfoPopup isVisible={isVisible} />
                                    <TradeHistoryInfoPopup />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountInfoPopup);
