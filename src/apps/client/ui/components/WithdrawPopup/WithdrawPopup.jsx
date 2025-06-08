import React, { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import format from "date-fns/format"
import classNames from "classnames"

import styles from "./WithdrawPopup.css"

import propOr from "@tinkoff/utils/object/propOr"
import pathOr from "@tinkoff/utils/object/pathOr"
import isUndefined from "@tinkoff/utils/is/undefined"
import isObject from "@tinkoff/utils/is/object"
import isArray from "@tinkoff/utils/is/array"

import required from "../Form/validators/required"

import outsideClick from "../../hocs/outsideClick.jsx"
// import setAccountInfoPopup from '../../../actions/setAccountInfoPopup';
import setTransactionsPopup from "../../../actions/setTransactionPopup"
import setWithdrawSuccessPopup from "../../../actions/setWithdrawSuccessPopup"
import saveTransaction from "../../../services/client/saveTransaction"
import saveMoneyOutput from "../../../services/client/saveMoneyOutput"

import FormInput from "../FormInput/FormInput"
import checkBalance from "../../../../../../server/api/admin/transaction/utils/checkBalance"

const mapStateToProps = ({ application, data }) => {
  return {
    langMap: application.langMap,
    transactions: data.transactions,
    user: data.user,
  }
}

const mapDispatchToProps = (dispatch) => ({
  saveMoneyOutput: (payload) => dispatch(saveMoneyOutput(payload)),
  saveTransaction: (payload) => dispatch(saveTransaction(payload)),
  // setAccountInfoPopup: payload => dispatch(setAccountInfoPopup(payload)),
  setTransactionsPopup: (payload) => dispatch(setTransactionsPopup(payload)),
  setWithdrawSuccessPopup: (payload) =>
    dispatch(setWithdrawSuccessPopup(payload)),
})

@outsideClick
class WithdrawPopup extends Component {
  static propTypes = {
    langMap: PropTypes.object.isRequired,
    transactions: PropTypes.array.isRequired,
    // setAccountInfoPopup: PropTypes.func.isRequired,
    setTransactionsPopup: PropTypes.func.isRequired,
    user: PropTypes.object,
    turnOnClickOutside: PropTypes.func.isRequired,
    outsideClickEnabled: PropTypes.bool,
    saveTransaction: PropTypes.func.isRequired,
    saveMoneyOutput: PropTypes.func.isRequired,
    isVisible: PropTypes.bool,
    setWithdrawSuccessPopup: PropTypes.func.isRequired,
  }

  static defaultProps = {
    transactions: [],
  }

  constructor(props) {
    super(props)
    this.state = {
      ...this.defaultState(),
      error: "",
    }
  }

  componentDidUpdate(prevProps) {
    const { outsideClickEnabled } = this.props

    if (!outsideClickEnabled) {
      this.props.turnOnClickOutside(this, this.closePopup)
    }

    if (prevProps.isVisible !== this.props.isVisible && !this.props.isVisible) {
      this.setState({
        ...this.defaultState(),
        error: "",
      })
    }
  }

  defaultState() {
    return {
      withdrawOnCard: { active: true },
      withdrawOnCrypto: { active: false },
      withdrawOnBank: { active: false },
      amount: { value: "", focus: false, isValid: true },
      numberCard: { value: "", focus: false, isValid: true },
      cardHolderName: { value: "", focus: false, isValid: true },
      wallet: { value: "", focus: false, isValid: true },
    }
  }

  handleChange = (name, value) => (e) => {
    e.stopPropagation()
    const actualValue = isUndefined(value) ? e.target.value : value

    if (actualValue.length > this.state.maxLength) return

    this.setState({
      [name]: {
        ...this.state[name],
        value: actualValue,
        focus: isUndefined(value),
        isValid: true,
      },
      error: "",
    })
  }

  onFocus = (name) => (e) => {
    e.stopPropagation()
    this.setState({
      [name]: { ...this.state[name], focus: !this.state[name].focus },
    })
  }

  onBlur = (name) => {
    const currentState = this.handleCheckErrors([name])

    this.setState({
      [name]: {
        ...this.state[name],
        focus: false,
        isValid: currentState[name].isValid,
      },
    })
  }

  handleCheckErrors = (names = []) => {
    const thisState = {}
    this.setState({
      error: "",
    })

    names.forEach((name) => {
      const property = this.state[name]

      if (isObject(property) && !isArray(property)) {
        let isValid = true
        let error

        if (name === "amount") {
          if (
            (this.state[name].value < 5 && !!this.state[name].value) ||
            !this.state[name].value
          ) {
            error = "MinValue"
          } else if (
            !checkBalance(this.props.user.balance - this.state[name].value) &&
            !!this.state[name].value
          ) {
            error = "Balance"
          }
        } else {
          error = ""
        }

        if (error) {
          isValid = false
        }

        const newValue = { ...property, isValid }
        thisState[name] = newValue

        this.setState({
          [name]: newValue,
          error,
        })
      }
    })

    return thisState
  }

  choiceFunds = (choice) => {
    this.setState({
      ...this.state,
      withdrawOnCard: { active: false },
      withdrawOnCrypto: { active: false },
      withdrawOnBank: { active: false },
      [choice]: { active: true },
    })
  }

  handleSubmit = (e) => {
    e.preventDefault()

    const { amount, numberCard, cardHolderName, wallet } = this.state

    const thisState = this.handleCheckErrors(Object.keys(this.state))
    let isValid = required(amount.value, { text: false }) === undefined

    for (let key in thisState) {
      if (!pathOr(["isValid"], true, thisState[key])) {
        isValid = false
      }
    }

    if (isValid) {
      this.props
        .saveMoneyOutput({
          userId: this.props.user.id,
          amount: amount.value,
          numberCard: numberCard.value,
          cardHolderName: cardHolderName.value,
          wallet: wallet.value,
        })
        .then(() => {
          this.props.setWithdrawSuccessPopup({
            visible: true,
            amount: amount.value,
            numberCard: numberCard.value,
            cardHolderName: cardHolderName.value,
            wallet: wallet.value,
          })
          setTimeout(() => this.closePopup(), 2000)
        })
        .catch((e) => {
          this.setState({ error: e.message })
        })
    }
  }

  handleOutsideClick = () => {
    this.props.turnOnClickOutside(this, this.closePopup)
  }

  closePopup = () => {
    this.props.setWithdrawSuccessPopup({
      visible: false,
      amount: this.state.amount.value,
      numberCard: this.state.numberCard.value,
      cardHolderName: this.state.cardHolderName.value,
      wallet: this.state.wallet.value,
    })
    // this.props.setAccountInfoPopup();
    this.props.setTransactionsPopup(false)
  }

  getDate = (currentDate) => {
    const date = new Date(currentDate)
    return format(date, "dd.MM.yyyy HH:mm")
  }
  // transactions - props
  render() {
    const { langMap, isVisible } = this.props
    const { error } = this.state
    const text = propOr("accountInfo", {}, langMap).transaction

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
                <div className={styles.transactionPopupContainer}>
                  <div className={styles.footer}>
                    <div className={styles.rightContainer}>
                      <div className={styles.funds}>
                        <div
                          className={classNames(styles.choiceFunds, {
                            [styles.activeFunds]:
                              this.state.withdrawOnCard.active,
                          })}
                          onClick={() => this.choiceFunds("withdrawOnCard")}
                        >
                          {text.withdrawOnCard}
                        </div>
                        <div
                          className={classNames(styles.choiceFunds, {
                            [styles.activeFunds]:
                              this.state.withdrawOnCrypto.active,
                          })}
                          onClick={() => this.choiceFunds("withdrawOnCrypto")}
                        >
                          {text.withdrawOnCrypto}
                        </div>
                        <div
                          className={classNames(styles.choiceFunds, {
                            [styles.activeFunds]:
                              this.state.withdrawOnBank.active,
                          })}
                          onClick={() => this.choiceFunds("withdrawOnBank")}
                        >
                          {text.withdrawOnBank}
                        </div>
                      </div>
                      {this.state.withdrawOnCard.active && (
                        <form
                          className={styles.form}
                          onSubmit={this.handleSubmit}
                        >
                          <div className={styles.inputWrapper}>
                            <div className={styles.amountContainerField}>
                              <div className={styles.summ}>
                                {text.cardNumberTitle}
                              </div>
                              <FormInput
                                texts={{
                                  numberCard: text.inputPlaceholderCard,
                                }}
                                name="numberCard"
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.numberCard.value}
                                focus={this.state.numberCard.value}
                                type="number"
                              />
                            </div>
                            <div className={styles.amountContainerField}>
                              <div className={styles.summ}>
                                {text.cardHolderName}
                              </div>
                              <FormInput
                                texts={{
                                  cardHolderName: text.inputPlaceholderName,
                                }}
                                name="cardHolderName"
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.cardHolderName.value}
                                focus={this.state.cardHolderName.value}
                                type="text"
                              />
                            </div>
                            <div className={styles.amountContainerField}>
                              <div className={styles.summ}>{text.summ}, $</div>
                              <FormInput
                                texts={{ amount: text.inputPlaceholder }}
                                name="amount"
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.amount.value}
                                focus={this.state.amount.value}
                                type="number"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className={classNames(styles.button, {
                              [styles.buttonUnactive]:
                                !this.state["amount"].isValid || error,
                            })}
                          >
                            {text.moneyWithdrawal}
                            <div
                              className={classNames(styles.failedPopup, {
                                [styles.isFailedPopup]:
                                  !this.state["amount"].isValid || error,
                              })}
                            >
                              <img
                                src="/src/apps/client/ui/components/ConfirmPopup/img/info.svg"
                                alt="info"
                              />
                              <div className={styles.title}>
                                {!this.state["amount"].isValid &&
                                  "Недостаточно средств"}
                              </div>
                            </div>
                          </button>
                        </form>
                      )}
                      {this.state.withdrawOnCrypto.active && (
                        <form
                          className={styles.form}
                          onSubmit={this.handleSubmit}
                        >
                          <div className={styles.inputWrapper}>
                            <div className={styles.amountContainerField}>
                              <div className={styles.summ}>{text.wallet}</div>
                              <FormInput
                                texts={{
                                  wallet: text.inputPlaceholderWallet,
                                }}
                                name="wallet"
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.wallet.value}
                                focus={this.state.wallet.value}
                                type="text"
                              />
                            </div>
                            <div className={styles.amountContainerField}>
                              <div className={styles.summ}>{text.summ}, $</div>
                              <FormInput
                                texts={{ amount: text.inputPlaceholder }}
                                name="amount"
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.amount.value}
                                focus={this.state.amount.value}
                                type="number"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className={classNames(styles.button, {
                              [styles.buttonUnactive]:
                                !this.state["amount"].isValid || error,
                            })}
                          >
                            {text.moneyWithdrawal}
                            <div
                              className={classNames(styles.failedPopup, {
                                [styles.isFailedPopup]:
                                  !this.state["amount"].isValid || error,
                              })}
                            >
                              <img
                                src="/src/apps/client/ui/components/ConfirmPopup/img/info.svg"
                                alt="info"
                              />
                              <div className={styles.title}>
                                {!this.state["amount"].isValid &&
                                  "Недостаточно средств"}
                              </div>
                            </div>
                          </button>
                        </form>
                      )}
                      {this.state.withdrawOnBank.active && (
                        <div
                          className={classNames(
                            styles.summ,
                            styles.wrapText,
                            styles.tabletText
                          )}
                        >
                          {text.bankTransferText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WithdrawPopup)
