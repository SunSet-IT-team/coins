import FormFieldInput from '../Form/fields/FormFieldInput/FormFieldInput.jsx';
import FormFieldBlockButtons from '../Form/fields/FormFieldButtons/FormFieldButtons';
import FormFieldSelect from '../Form/fields/FormFieldSelect/FormFieldSelect';
import {
    CURRENCIES_SYMBOLS,
    VALUES_SYMBOLS,
    COMPANY_SHARES_SYMBOLS,
    INDICES_SYMBOLS,
    CRYPTO_CURRENCIES_SYMBOLS,
} from '../../../../../../server/constants/symbols';

const getAllAssets = () => {
    const allAssets = [
        ...CRYPTO_CURRENCIES_SYMBOLS,
        ...CURRENCIES_SYMBOLS,
        ...VALUES_SYMBOLS,
        ...COMPANY_SHARES_SYMBOLS,
        ...INDICES_SYMBOLS,
    ];
    return allAssets.map((asset) => ({
        value: asset.name,
        label: asset.title,
        name: asset.name,
    }));
};

export default function ({data: {} = {}} = {}) {
    const assets = getAllAssets();
    return {
        fields: [
            {
                component: FormFieldSelect,
                name: 'assetName',
                schema: {
                    label: 'Название актива',
                    options: assets,
                    isSearchable: false,
                },
                validators: [{name: 'required', options: {text: 'Выберите актив'}}],
            },
            {
                component: FormFieldInput,
                name: 'currentPrice',
                schema: {
                    label: 'Текущая цена',
                    readOnly: true,
                },
                validators: [],
            },
            {
                component: FormFieldInput,
                name: 'priceWithOffset',
                schema: {
                    label: 'Цена с отклонением',
                    readOnly: true,
                },
                validators: [],
            },
            {
                component: FormFieldInput,
                name: 'priceOffset',
                schema: {
                    label: 'Отклонение цены',
                },
                validators: [{name: 'required', options: {text: 'Заполните поле отклонения цены'}}],
            },
            {
                component: FormFieldBlockButtons,
                name: 'submit',
                schema: {
                    buttons: [
                        {
                            label: 'Сохранить',
                            type: 'submit',
                        },
                    ],
                },
            },
        ],
    };
}
