import React, { Component } from 'react';
import PropTypes from 'prop-types';

import TextField from '@material-ui/core/TextField';

import noop from '@tinkoff/utils/function/noop';

export default class FormFieldDate extends Component {
    static propTypes = {
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.instanceOf(Date)
        ]),
        schema: PropTypes.object,
        onChange: PropTypes.func,
        onBlur: PropTypes.func,
        validationMessage: PropTypes.string,
        type: PropTypes.string
    };

    static defaultProps = {
        value: '',
        schema: {},
        onChange: noop,
        onBlur: noop,
        validationMessage: '',
        type: 'date'
    };

    handleChange = event => {
        event.preventDefault();

        this.props.onChange(event.target.value);
    };

    formatDateValue = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            const hours = String(value.getHours()).padStart(2, '0');
            const minutes = String(value.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        return '';
    };

    render () {
        const { value, validationMessage, schema, type } = this.props;

        return <TextField
            label={schema.label}
            value={this.formatDateValue(value)}
            onChange={this.handleChange}
            onBlur={this.props.onBlur}
            error={!!validationMessage}
            margin='normal'
            variant='outlined'
            type={type}
            InputLabelProps={{
                shrink: true
            }}
        />;
    }
}
