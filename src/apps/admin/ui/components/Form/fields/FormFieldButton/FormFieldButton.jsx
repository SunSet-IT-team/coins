import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {CircularProgress, Button} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';

import noop from '@tinkoff/utils/function/noop';

const materialStyles = {
    buttonRoot: {
        display: 'inline-flex',
        marginTop: '16px',
    },
};

class FormFieldButton extends Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        schema: PropTypes.object,
    };

    static defaultProps = {
        schema: {},
    };

    render() {
        const {classes, schema} = this.props;

        return (
            <div className={classes.buttonRoot}>
                <Button
                    variant="contained"
                    color={schema.color || 'primary'}
                    type={schema.type || 'button'}
                    disabled={schema.disabled}
                    onClick={schema.onClick || noop}
                >
                    {schema.isLoading ? (
                        <CircularProgress style={{color: '#ffffff'}} size={24} />
                    ) : (
                        schema.label
                    )}
                </Button>
            </div>
        );
    }
}

export default withStyles(materialStyles)(FormFieldButton);
