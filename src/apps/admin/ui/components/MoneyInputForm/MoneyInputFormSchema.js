import FormFieldTitle from '../Form/fields/FormFieldTitle/FormFieldTitle.jsx';
import FormFieldButton from '../Form/fields/FormFieldButton/FormFieldButton.jsx';
import FormFieldRadios from '../Form/fields/FormFieldRadios/FormFieldRadios.jsx';
import FormFieldDivider from '../Form/fields/FormFieldDivider/FormFieldDivider.jsx';
import FormFieldInput from '../Form/fields/FormFieldInput/FormFieldInput.jsx';

export default function ({data: {title, name, date, amount} = {}} = {}) {
    return {
        fields: [
            {
                component: FormFieldTitle,
                name: 'form-title',
                schema: {
                    label: title,
                    variant: 'h5',
                },
            },
            {
                component: FormFieldDivider,
                name: 'divider',
            },
            {
                component: FormFieldTitle,
                name: 'name',
                schema: {
                    label: `Имя: ${name}`,
                    variant: 'body1',
                },
            },
            {
                component: FormFieldTitle,
                name: 'date',
                schema: {
                    label: `Дата запроса: ${date}`,
                    variant: 'body1',
                },
            },
            {
                component: FormFieldInput,
                name: 'amount',
                schema: {
                    label: `Сумма запроса`,
                    // variant: 'body1',
                },
            },
            {
                component: FormFieldDivider,
                name: 'divider',
            },
            {
                component: FormFieldTitle,
                name: 'titleType',
                schema: {
                    label: 'Статус обработки',
                    variant: 'h5',
                },
            },
            {
                component: FormFieldRadios,
                name: 'status',
                schema: {
                    label: 'Статус',
                    options: [
                        {label: 'В ожидании', value: 'В ожидании'},
                        {label: 'Выполнена', value: 'Выполнена'},
                        {label: 'Отменена', value: 'Отменена'},
                    ],
                },
            },
            {
                component: FormFieldButton,
                name: 'submit',
                schema: {
                    label: 'Сохранить',
                    type: 'submit',
                },
            },
        ],
    };
}
