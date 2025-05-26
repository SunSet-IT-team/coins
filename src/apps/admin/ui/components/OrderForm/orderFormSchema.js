import FormFieldInput from "../Form/fields/FormFieldInput/FormFieldInput.jsx"
import FormFieldTitle from "../Form/fields/FormFieldTitle/FormFieldTitle.jsx"
import FormFieldBlockButtons from "../Form/fields/FormFieldButtons/FormFieldButtons"
import FormFieldDate from "../Form/fields/FormFieldDate/FormFieldDate"
import FormFieldRadios from "../Form/fields/FormFieldRadios/FormFieldRadios"
import FormFieldSelect from "../Form/fields/FormFieldSelect/FormFieldSelect"
import FormFieldBalance from "../Form/fields/FormFieldBalance/FormFieldBalance"
import {
  CURRENCIES_SYMBOLS,
  VALUES_SYMBOLS,
  COMPANY_SHARES_SYMBOLS,
  INDICES_SYMBOLS,
  CRYPTO_CURRENCIES_SYMBOLS,
} from "../../../../../../server/constants/symbols"

const getAllAssets = () => {
  const allAssets = [
    ...CRYPTO_CURRENCIES_SYMBOLS,
    ...CURRENCIES_SYMBOLS,
    ...VALUES_SYMBOLS,
    ...COMPANY_SHARES_SYMBOLS,
    ...INDICES_SYMBOLS,
  ]
  return allAssets.map((asset) => ({
    value: asset.name,
    label: asset.title,
    name: asset.name,
  }))
}

export default function ({
  data: { title, isClosed } = {},
} = {}) {
  const assets = getAllAssets()
  return {
    fields: [
      {
        component: FormFieldTitle,
        name: "form-title",
        schema: {
          label: title,
          variant: "h5",
        },
      },
      {
        component: FormFieldBalance,
        name: "balance",
        schema: {
          label: "Баланс пользователя",
        },
      },
      {
        component: FormFieldSelect,
        name: "assetName",
        schema: {
          label: "Название актива",
          options: assets,
          isSearchable: true,
        },
        validators: [{ name: "required", options: { text: "Выберите актив" } }],
      },
      {
        component: FormFieldRadios,
        name: "type",
        schema: {
          label: "",
          options: [
            { label: "Покупка", value: "buy" },
            { label: "Продажа", value: "sell" },
          ],
        },
      },
      {
        component: FormFieldDate,
        name: "createdAt",
        schema: {
          label: "Дата создания ордера",
        },
        type: "datetime-local",
        validators: [
          {
            name: "required",
            options: { text: "Заполните дату создания ордера" },
          },
        ],
      },
      {
        component: FormFieldInput,
        name: "openingPrice",
        schema: {
          label: "Курс открытия",
        },
        validators: [
          { name: "required", options: { text: "Заполните курс открытия" } },
        ],
      },
      {
        component: FormFieldInput,
        name: "amount",
        schema: {
          label: "Объем",
        },
        validators: [
          { name: "required", options: { text: "Заполните объем" } },
        ],
      },
      {
        component: FormFieldInput,
        name: "pledge",
        schema: {
          label: "Залог",
        },
        validators: [
          { name: "required", options: { text: "Заполните залог" } },
        ],
      },
      {
        component: FormFieldDate,
        name: "closedAt",
        schema: {
          label: "Дата закрытия ордера",
        },
        type: "datetime-local",
        hidden: !isClosed,
        ...(isClosed
          ? {
              validators: [
                {
                  name: "required",
                  options: { text: "Заполните дату закрытия ордера" },
                },
              ],
            }
          : {}),
      },
      {
        component: FormFieldInput,
        name: "closedPrice",
        schema: {
          label: "Цена закрытия",
        },
        hidden: !isClosed,
        ...(isClosed
          ? {
              validators: [
                {
                  name: "required",
                  options: { text: "Заполните цену закрытия" },
                },
              ],
            }
          : {}),
      },
      {
        component: FormFieldInput,
        name: "profit",
        schema: {
          label: "Прибыль",
          readonly: true,
        },
        validators: [],
      },
      {
        component: FormFieldInput,
        name: "takeProfit",
        schema: {
          label: "Take profit",
        },
        validators: [],
      },
      {
        component: FormFieldInput,
        name: "stopLoss",
        schema: {
          label: "stopLoss",
        },
        validators: [],
      },
      {
        component: FormFieldBlockButtons,
        name: "submit",
        schema: {
          buttons: [
            {
              label: "Сохранить",
              type: "submit",
            },
          ],
        },
      },
    ],
  }
}
