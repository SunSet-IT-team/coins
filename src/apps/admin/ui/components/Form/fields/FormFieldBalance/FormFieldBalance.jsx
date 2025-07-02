import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

const styles = (theme) => ({
    root: {
        padding: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
        backgroundColor: 'transparent',
    },
    balanceBlock: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing.unit / 2,
    },
    label: {
        color: '#9BA6B2',
        fontSize: '14px',
        marginRight: theme.spacing.unit,
    },
    amount: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#000',
    },
    gridContainer: {
        margin: 0,
    },
});

const FormFieldBalance = ({classes, schema, value}) => {
    return (
        <div className={classes.root}>
            <Grid container className={classes.gridContainer}>
                <Grid item xs={12}>
                    <div className={classes.balanceBlock}>
                        <Typography variant="subtitle2" className={classes.label}>
                            Баланс:
                        </Typography>
                        <Typography className={classes.amount}>
                            $ {Number(value || 0).toFixed(2)}
                        </Typography>
                    </div>
                </Grid>
            </Grid>
        </div>
    );
};

FormFieldBalance.propTypes = {
    classes: PropTypes.object.isRequired,
    schema: PropTypes.shape({
        label: PropTypes.string,
    }),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

FormFieldBalance.defaultProps = {
    schema: {},
    value: 0,
};

export default withStyles(styles)(FormFieldBalance);
