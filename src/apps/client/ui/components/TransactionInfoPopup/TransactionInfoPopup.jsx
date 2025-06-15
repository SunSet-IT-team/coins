import React, { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import format from "date-fns/format"
// import classNames from 'classnames';

import styles from "./TransactionInfoPopup.css"

import propOr from "@tinkoff/utils/object/propOr"
import pathOr from "@tinkoff/utils/object/pathOr"
import isUndefined from "@tinkoff/utils/is/undefined"
import isObject from "@tinkoff/utils/is/object"
import isArray from "@tinkoff/utils/is/array"

import required from "../Form/validators/required"

import setAccountInfoPopup from "../../../actions/setAccountInfoPopup"
import setWithdrawSuccessPopup from "../../../actions/setWithdrawSuccessPopup"
import saveMoneyOutput from "../../../services/client/saveMoneyOutput"
import getClientMoneyOutput from "../../../services/client/getClientMoneyOutput"
import outputWebsocketController from "../../../../admin/services/outputWebsocket"

// import FormInput from '../FormInput/FormInput';
import checkBalance from "../../../../../../server/api/admin/transaction/utils/checkBalance"

const mapStateToProps = ({ application, data }) => {
  return {
    langMap: application.langMap,
    transactions: data.transactions,
    user: data.user,
    moneyOutput: data.moneyOutput,
  }
}

const mapDispatchToProps = (dispatch) => ({
  saveMoneyOutput: (payload) => dispatch(saveMoneyOutput(payload)),
  setAccountInfoPopup: (payload) => dispatch(setAccountInfoPopup(payload)),
  setWithdrawSuccessPopup: (payload) =>
    dispatch(setWithdrawSuccessPopup(payload)),
  getClientMoneyOutput: (payload) => dispatch(getClientMoneyOutput(payload)),
})

class TransactionInfoPopup extends Component {
  static propTypes = {
    langMap: PropTypes.object.isRequired,
    transactions: PropTypes.array.isRequired,
    setAccountInfoPopup: PropTypes.func.isRequired,
    user: PropTypes.object,
    saveMoneyOutput: PropTypes.func.isRequired,
    setWithdrawSuccessPopup: PropTypes.func.isRequired,
    getClientMoneyOutput: PropTypes.func.isRequired,
    moneyOutput: PropTypes.array.isRequired,
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
    if (this.props.user && prevProps.user === null) this.getData()
  }

  defaultState() {
    return {
      amount: { value: "", focus: false, isValid: true },
      outputByUsers: [],
    }
  }

  getData = () => {
    const { user } = this.props
    if (user === null) return
    return this.props
      .getClientMoneyOutput()
      .then(() => {
        const userOutputs = this.props.moneyOutput.filter(
          (item) => item.userId === user.id
        )

        this.setState({
          outputByUsers: userOutputs.map((item) => ({
            status: item.status,
            date: item.createdAt,
            createdAt: item.createdAtDate,
            amount: item.amount,
            wallet: item.wallet,
            numberCard: item.numberCard,
            cardHolderName: item.cardHolderName,
            id: item.id,
            visited: item.visited,
            userId: user.id,
          })),
        })
      })
      .catch((error) => {
        console.error("Error fetching data:", error)
      })
  }

  componentDidMount() {
    // outputWebsocketController.connect()
    outputWebsocketController.events.on("output", this.qwerty)
    this.getData()
  }

  componentWillUnmount() {
    outputWebsocketController.events.removeListener("output", this.qwerty)
  }

  qwerty = (output) => {
    console.log(
      output,
      output.userId,
      this.props.user.id,
      output.userId === this.props.user.id
    )
    if (output.userId === this.props.user.id) {
      this.getData()
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

  handleSubmit = (e) => {
    e.preventDefault()

    const { amount } = this.state

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
        })
        .then(() => {
          this.props.setWithdrawSuccessPopup({
            visible: true,
            amount: amount.value,
          })
          setTimeout(() => this.closePopup(), 2000)
        })
        .catch((e) => {
          this.setState({ error: e.message })
        })
    }
  }

  closePopup = () => {
    this.props.setWithdrawSuccessPopup({
      visible: false,
      amount: this.state.amount.value,
    })
    this.props.setAccountInfoPopup()
  }

  getDate = (currentDate) => {
    const date = new Date(currentDate)
    return format(date, "dd.MM.yyyy HH:mm")
  }

  render() {
    const { langMap, transactions } = this.props
    const { outputByUsers } = this.state

    const transactionList = [...outputByUsers, ...transactions]

    const text = propOr("accountInfo", {}, langMap).transaction

    return (
      <div className={styles.transactionPopupContainer}>
        <div className={styles.navbar}>
          <div className={styles.itemNum}>#</div>
          <div className={styles.itemSum}>{text.summ}</div>
          <div className={styles.itemStatus}>{text.status}</div>
          <div className={styles.itemDate}>{text.date}</div>
        </div>
        <div className={styles.transactionsContainer}>
          {transactionList
            .sort((prev, next) => next.createdAt - prev.createdAt)
            .filter((item) => item.type !== "deduction")
            .map((item, i) => (
              <div key={i} className={styles.transactionItem}>
                <div className={styles.itemNum}>{i + 1}</div>
                <div className={styles.itemSum}>
                  $ {item.value || item.amount}
                </div>
                <div className={styles.itemStatus}>
                  {item.content || (
                    <div>
                      {item.status === "Новая" && (
                        <p>
                          {text.statusWithdraw}:{" "}
                          <span className={styles.processingStatus}>
                            {text.processing}
                          </span>
                        </p>
                      )}
                      {item.status === "В обработке" && (
                        <p>
                          {text.statusWithdraw}:{" "}
                          <span className={styles.processingStatus}>
                            {text.processing}
                          </span>
                        </p>
                      )}
                      {item.status === "Успешно" && (
                        <p>
                          {text.statusWithdraw}:{" "}
                          <span className={styles.executedStatus}>
                            {text.executed}
                          </span>
                        </p>
                      )}
                      {item.status === "Отменена" && (
                        <p>
                          {text.statusWithdraw}:{" "}
                          <span className={styles.canceledStatus}>
                            {text.canceled}
                          </span>
                        </p>
                      )}
                      {item.wallet ? (
                        <p>
                          {text.inputPlaceholderWallet}: {item.wallet}
                        </p>
                      ) : (
                        <div>
                          <p>
                            {text.inputPlaceholderCard}: {item.numberCard}
                          </p>
                          <p>
                            {text.inputPlaceholderName}: {item.cardHolderName}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.itemDate}>
                  {this.getDate(item.createdAt)}
                </div>
              </div>
            ))}
          {/*  {outputByUsers.length && outputByUsers
                    .sort((prev, next) => next.createdAtDate - prev.createdAtDate)
                    .map((item, i) => <div key={i} className={styles.transactionItem}>
                        <div className={styles.itemNum}>{i + 1}</div>
                        <div className={styles.itemSum}>$ {item.amount}</div>
                        <div className={styles.itemStatus}>
                            <p>Статус: {item.status}</p>
                            <p>Карта: {item.numberCard}</p>
                            <p>Владелец: {item.cardHolderName}</p>
                        </div>
                        <div className={styles.itemDate}>{this.getDate(item.createdAtDate)}</div>
                    </div>)}
                {outputByUsers.length && transactions
                    .sort((prev, next) => next.createdAt - prev.createdAt)
                    .map((item, i) => {
                        if (item.type !== 'deduction') {
                            return (<div key={i} className={styles.transactionItem}>
                                <div className={styles.itemNum}>{outputByUsers.length + 1}</div>
                                <div className={styles.itemSum}>$ {item.value}</div>
                                <div className={styles.itemStatus}>
                                    {item.content}
                                </div>
                                <div className={styles.itemDate}>{this.getDate(item.createdAt)}</div>
                            </div>);
                        }
                    })} */}
        </div>
        {/*   <div className={styles.footer}> */}
        {/*  <div className={styles.funds}>{text.moneyWithdrawalTitle}</div> */}
        {/*   <div className={styles.rightContainer}> */}
        {/*       <div className={styles.summ}>{text.summ}, $</div> */}
        {/*      <form className={styles.form} onSubmit={this.handleSubmit} > */}
        {/*        <div className={styles.amountContainerField}> */}
        {/*          <FormInput
                                texts={{ amount: text.inputPlaceholder }}
                                name='amount'
                                onFocus={this.onFocus}
                                onBlur={this.onBlur}
                                handleChange={this.handleChange}
                                value={this.state.amount.value}
                                focus={this.state.amount.value}
                                type='number'
                            /> */}
        {/*    </div> */}
        {/*      <button type='submit' className={classNames(styles.button, {
                            [styles.buttonUnactive]: !this.state['amount'].isValid || error
                        })}> */}
        {/*    {text.moneyWithdrawal} */}
        {/*   <div className={classNames(styles.failedPopup, {
                                [styles.isFailedPopup]: !this.state['amount'].isValid || error
                            })}> */}
        {/*       <img src="/src/apps/client/ui/components/ConfirmPopup/img/info.svg" alt="info" /> */}
        {/*       <div className={styles.title}> */}
        {/* {!this.state['amount'].isValid && (error || 'Недостаточно средств')} */}
        {/*         {text.error[`failed${!this.state['amount'].isValid || error ? error : ''}`]} */}
        {/*       </div> */}
        {/*     </div> */}
        {/*    </button> */}
        {/*    </form> */}
        {/*  </div> */}
        {/*    </div> */}
      </div>
    )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionInfoPopup)
