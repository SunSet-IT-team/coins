import React, { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import getSchema from "./orderFormSchema"
import editOrder from "../../../services/editOrder"
import saveOrder from "../../../services/saveOrder"
import Form from "../Form/Form"
import noop from "@tinkoff/utils/function/noop"
import prop from "@tinkoff/utils/object/prop"
import pick from "@tinkoff/utils/object/pick"
import uniqid from "uniqid"
import format from "date-fns/format"
import {
  getPledge,
  getOpeningSlotPrice,
  getProfit,
  getClosingPrice,
  getProfitByClosingPrice,
  getLimitProfit,
} from "../../../../client/utils/getAssetValues"
import { CHART_SYMBOL_INFO_MAP } from "../../../../../../server/constants/symbols"
import SnackbarContent from "@material-ui/core/SnackbarContent"
import classNames from "classnames"
import ErrorIcon from "@material-ui/icons/Error"
import Snackbar from "@material-ui/core/Snackbar"
import { withStyles } from "@material-ui/core/styles"
import formatNumberToString from "../../../../client/utils/formatNumberToString"
import assetPriceWebsocketController from "../../../../client/services/client/assetPriceWebsocket"
import calculateBuyingPrice from "../../../../client/utils/calculateBuyPrice"

function clampProfitToMax(formData, asset) {
  if (formData.openingPrice && formData.amount && formData.type) {
    const maxProfit = getLimitProfit(
      formData.openingPrice,
      formData.amount,
      formData.type,
      asset
    )

    if (
      (formData.type === "buy" && formData.profit < maxProfit) ||
      (formData.type === "sell" && formData.profit > maxProfit)
    )
      formData.profit = maxProfit
  }
}

const ORDERS_VALUES = ["userId", "id"]

const materialStyles = (theme) => ({
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  success: {
    backgroundColor: theme.palette.success.main,
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing.unit,
  },
  message: {
    display: "flex",
    alignItems: "center",
  },
  margin: {
    margin: theme.spacing.unit,
  },
  errorMessage: {
    color: theme.palette.error.main,
    marginTop: theme.spacing.unit,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  root: {
    position: "relative",
  },
})

const mapDispatchToProps = (dispatch) => ({
  editOrder: (payload) => dispatch(editOrder(payload)),
  saveOrder: (payload) => dispatch(saveOrder(payload)),
})

class OrderForm extends Component {
  static propTypes = {
    editOrder: PropTypes.func.isRequired,
    saveOrder: PropTypes.func.isRequired,
    onDone: PropTypes.func,
    order: PropTypes.object,
    users: PropTypes.array,
    activeUser: PropTypes.object,
    classes: PropTypes.object,
  }

  static defaultProps = {
    onDone: noop,
    order: {},
    users: [],
    activeUser: {},
  }

  constructor(props) {
    super(props)

    const { order } = this.props
    this.dirName = order.dirName || uniqid()
    this.isClosed = order.isClosed
    this.initialValues = {
      assetName: order.assetName || "",
      createdAt: order.createdAt
        ? format(order.createdAt, "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      openingPrice: order.openingPrice || "",
      amount: order.amount || "",
      pledge: order.pledge || "",
      profit: formatNumberToString(order.profit),
      closedPrice: order.closedPrice || "",
      type:
        order.type && ["buy", "sell"].includes(order.type) ? order.type : "buy",
      ...(order.closedAt
        ? { closedAt: format(order.closedAt, "yyyy-MM-dd'T'HH:mm") }
        : {}),
      ...pick(ORDERS_VALUES, order),
      takeProfit: order.takeProfit || "",
      stopLoss: order.stopLoss || "",
    }

    const asset = CHART_SYMBOL_INFO_MAP[this.initialValues.assetName]

    if (
      asset &&
      this.initialValues.profit &&
      this.initialValues.amount &&
      this.initialValues.openingPrice &&
      this.initialValues.type
    ) {
      const calculatedClosedPrice = getClosingPrice(
        Number(this.initialValues.openingPrice),
        Number(this.initialValues.profit),
        Number(this.initialValues.amount),
        this.initialValues.type,
        asset
      )

      this.initialValues.closedPrice = calculatedClosedPrice
    }

    this.id = prop("id", order)
    this.state = {
      errorText: "",
      userFormData: {},
      profitFreeze: {
        checkbox: false,
        userInput: false,
      },
    }
  }

  getOrderPayload = ({
    assetName,
    createdAt,
    openingPrice,
    amount,
    pledge,
    type,
    closedAt,
    closedPrice,
    takeProfit,
    stopLoss,
  }) => {
    const { activeUser } = this.props
    return {
      assetName,
      createdAt: +new Date(createdAt),
      openingPrice: Number(openingPrice),
      amount: Number(amount),
      pledge: Number(pledge),
      type,
      ...(closedAt ? { closedAt: +new Date(closedAt) } : {}),
      ...(closedPrice ? { closedPrice: Number(closedPrice) } : {}),
      dirName: this.dirName,
      userId: activeUser.id,
      isClosed: this.isClosed || false,
      takeProfit: takeProfit ? Number(takeProfit) : 0,
      stopLoss: stopLoss ? Number(stopLoss) : 0,
    }
  }

  handleSubmit = async (values) => {
    const orderPayload = this.getOrderPayload(values)
    const { editOrder, saveOrder, onDone } = this.props

    return new Promise(async (resolve, reject) => {
      try {
        if (this.id) {
          await editOrder({ ...orderPayload, id: this.id })
        } else {
          await saveOrder(orderPayload)
        }
        onDone()
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }

  setProfitFreeze(value) {
    this.setState((prevState) => ({
      profitFreeze: {
        ...prevState.profitFreeze,
        ...value,
      },
    }))
  }

  handleChange = (values, changes) => {
    const changeKey = Object.keys(changes)[0]
    const changeValue = changes[changeKey]

    const updatedFormData = {
      ...values,
      ...this.state.userFormData,
      ...changes,
    }

    const asset = CHART_SYMBOL_INFO_MAP[updatedFormData.assetName]

    switch (changeKey) {
      case "userId":
        const activeUser = this.props.users.find(
          (user) => user.id === changeValue
        )
        const { lang } = this.state
        updatedFormData.orderId = activeUser.texts[lang].order[0].id
        break

      case "amount":
        if (asset) {
          const openingSlotPrice = getOpeningSlotPrice(
            asset,
            updatedFormData.openingPrice
          )
          updatedFormData.pledge = getPledge(changeValue, openingSlotPrice)
        }
        break

      case "openingPrice":
        if (asset && updatedFormData.amount) {
          const openingSlotPrice = getOpeningSlotPrice(asset, changeValue)
          updatedFormData.pledge = getPledge(
            updatedFormData.amount,
            openingSlotPrice
          )
        }
        break

      case "profit":
        if (
          asset &&
          updatedFormData.openingPrice &&
          updatedFormData.amount &&
          updatedFormData.type
        ) {
          this.setProfitFreeze({
            userInput: true,
            // userInput: Number(changeValue) !== 0, // Если надо, чтобы после удалении пользователем значении, возможно было обновление поля
          })
        }
        break

      case "profitFreeze":
        if (this.state.profitFreeze.userInput) {
          this.setProfitFreeze({
            userInput: false,
            checkbox: false,
          })
        } else {
          this.setProfitFreeze({
            checkbox: !this.state.profitFreeze.checkbox,
          })
        }
        break

      case "closedPrice":
        this.setProfitFreeze({
          userInput: true,
          // userInput: Number(changeValue) !== 0, // Если надо, чтобы после удалении пользователем значении, возможно было обновление поля
        })

        // Пересчет поля "прибыль"
        if (
          asset &&
          updatedFormData.openingPrice &&
          updatedFormData.amount &&
          updatedFormData.type
        ) {
          const profit = getProfitByClosingPrice(
            updatedFormData.openingPrice,
            changeValue,
            updatedFormData.amount,
            updatedFormData.type,
            asset
          )
          updatedFormData.profit = profit
          clampProfitToMax(updatedFormData, asset)
        }
        break

      case "type":
        const validTypes = ["buy", "sell"]
        updatedFormData.type = validTypes.includes(changeValue)
          ? changeValue
          : "buy"
        break
    }

    this.setState({
      userFormData: updatedFormData,
    })

    // Пересчет поля "прибыль" и "цена закрытия"
    if (["openingPrice", "profit", "amount", "type"].includes(changeKey)) {
      const doNotUpdateProfit = ["profit", "type"].includes(changeKey)
      this.updateOrderAssets(updatedFormData, true, doNotUpdateProfit)
    }
  }

  handleInputChange = (e) => {
    const { name, value } = e.target
    this.handleChange({ [name]: value }, { [name]: value })
  }

  handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      (e.target.name === "profit" || e.target.name === "closedPrice")
    ) {
      e.preventDefault()
      if (e.target.value === "" || e.target.value === "0") {
        this.setProfitFreeze({ userInput: false })
        this.updateOrderAssets(undefined, true)
      }
    }
  }

  handleHideFailMessage = () => {
    this.setState({
      errorText: "",
    })
  }

  handleClose = () => {
    this.handleHideFailMessage()
  }

  updateOrderAssets(formData, isForce = false, doNotUpdateProfit = false) {
    const isFreeze =
      (this.state.profitFreeze.checkbox || this.state.profitFreeze.userInput) &&
      !isForce
    if (isFreeze) return

    const updatedFormData = formData || {
      ...this.initialValues,
      ...this.state.userFormData,
    }

    const asset = CHART_SYMBOL_INFO_MAP[updatedFormData.assetName]
    const livePrice =
      assetPriceWebsocketController.prices[updatedFormData.assetName]

    if (
      updatedFormData.amount &&
      updatedFormData.openingPrice &&
      livePrice &&
      updatedFormData.type &&
      asset &&
      !doNotUpdateProfit
    ) {
      const realPrice =
        updatedFormData.type === "buy"
          ? calculateBuyingPrice(asset.name, livePrice)
          : livePrice

      const profit = getProfit(
        Number(updatedFormData.amount),
        Number(updatedFormData.openingPrice),
        realPrice,
        updatedFormData.type,
        asset
      )

      updatedFormData.profit = profit
    }
    clampProfitToMax(updatedFormData, asset)

    const closedPrice = getClosingPrice(
      updatedFormData.openingPrice,
      updatedFormData.profit,
      updatedFormData.amount,
      updatedFormData.type,
      asset
    )
    updatedFormData.closedPrice = closedPrice

    this.setState({
      userFormData: updatedFormData,
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.orders !== this.props.orders) {
      this.updateOrderAssets()
    }
  }

  render() {
    const { classes, activeUser } = this.props
    const { errorText } = this.state

    const initialValues = {
      ...this.initialValues,
      balance: activeUser.mainBalance || 0,
      ...this.state.userFormData,
    }

    return (
      <div>
        <Form
          initialValues={initialValues}
          schema={getSchema({
            data: {
              title: this.id ? "Редактирование ордера" : "Добавление ордера",
              dirName: this.dirName,
              isClosed: this.isClosed,
              profitCheckboxProps: {
                value:
                  this.state.profitFreeze.checkbox ||
                  this.state.profitFreeze.userInput,
                title: "Заморозить",
                name: "profitFreeze",
                onChange: this.handleInputChange,
              },
              profitFreeze: this.state.profitFreeze,
            },
          })}
          onChange={this.handleChange}
          onSubmit={this.handleSubmit}
          onKeyDown={this.handleKeyDown}
        />

        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          onClose={this.handleHideFailMessage}
          open={!!errorText}
          autoHideDuration={2000}
        >
          <SnackbarContent
            className={classNames(classes.error, classes.margin)}
            message={
              <span id="client-snackbar" className={classes.message}>
                <ErrorIcon
                  className={classNames(classes.icon, classes.iconVariant)}
                />
                {errorText}
              </span>
            }
          />
        </Snackbar>
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(withStyles(materialStyles)(OrderForm))
