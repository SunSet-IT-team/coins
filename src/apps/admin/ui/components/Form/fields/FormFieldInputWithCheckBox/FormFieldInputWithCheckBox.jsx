import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputAdornment from '@material-ui/core/InputAdornment';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const styles = (theme) => ({
    formControl: {
        margin: theme.spacing.unit,
        width: '100%',
    },
});

const FormFieldInputWithCheckBox = ({
    classes,
    schema,
    value,
    name,
    validationMessage,
    onChange,
}) => {
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    const handleCheckboxChange = (e) => {
        if (typeof schema.checkBoxProps.onChange === 'function') {
            schema.checkBoxProps.onChange(e);
        }
    };

    return (
        <FormControl className={classes.formControl} error={!!validationMessage}>
            <InputLabel>{schema.label}</InputLabel>
            <Input
                type={schema.type || 'text'}
                value={
                    value !== undefined && value !== null && !Number.isNaN(value)
                        ? String(value)
                        : ''
                }
                name={name}
                onChange={handleChange}
                readOnly={schema.readOnly}
                endAdornment={
                    <InputAdornment position="end">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={schema.checkBoxProps.value}
                                    onChange={handleCheckboxChange}
                                    name={schema.checkBoxProps.name}
                                    color={schema.checkBoxProps.color || 'primary'}
                                />
                            }
                            label={schema.checkBoxProps.title}
                            labelPlacement="start"
                        />
                    </InputAdornment>
                }
            />
            {validationMessage && <FormHelperText>{validationMessage}</FormHelperText>}
        </FormControl>
    );
};

FormFieldInputWithCheckBox.propTypes = {
    classes: PropTypes.object.isRequired,
    schema: PropTypes.shape({
        label: PropTypes.string,
        type: PropTypes.string,
        readOnly: PropTypes.bool,
        checkBoxProps: PropTypes.shape({
            value: PropTypes.bool,
            title: PropTypes.string,
            name: PropTypes.string,
            onChange: PropTypes.func,
            color: PropTypes.string,
        }),
    }),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    validationMessage: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

FormFieldInputWithCheckBox.defaultProps = {
    schema: {},
    value: '',
    validationMessage: '',
};

export default withStyles(styles)(FormFieldInputWithCheckBox);
