import React, { Component } from 'react';
import { connect } from 'react-redux';

import classNames from 'classnames';

import styles from './PaymentsPage.css';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import green from '@material-ui/core/colors/green';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

import updatePayments from '../../../services/updatePayment';
import getPayments from '../../../services/getPaymentsRequisites';
import uploadFilesQr from '../../../services/uploadFilesQr';

const materialStyles = theme => ({
    buttons: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    successBlock: {
        display: 'flex',
        alignItems: 'center',
        position: 'absolute',
        bottom: '0px',
        right: '15px',
        height: '110px'
    },
    success: {
        backgroundColor: green[600]
    },
    error: {
        backgroundColor: theme.palette.error.dark
    },
    icon: {
        fontSize: 20
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit
    },
    message: {
        display: 'flex',
        alignItems: 'center'
    },
    margin: {
        margin: theme.spacing.unit
    }
});

const mapDispatchToProps = (dispatch) => ({
    updatePayments: payload => dispatch(updatePayments(payload)),
    getPayments: payload => dispatch(getPayments(payload)),
    uploadFilesQr: payload => dispatch(uploadFilesQr(payload))
});

class PaymentsPage extends Component {
    static propTypes = {
        classes: PropTypes.object,
        updatePayments: PropTypes.func.isRequired,
        getPayments: PropTypes.func.isRequired,
        uploadFilesQr: PropTypes.func.isRequired
    };

    constructor (props) {
        super(props);

        this.state = {
            usdt: '',
            bitcoin: '',
            swift: '',
            success: false
        };
    }

    componentDidMount () {
        this.props.getPayments().then(
            payments => this.setState({
                usdt: payments[0].usdt,
                bitcoin: payments[0].bitcoin,
                swift: payments[0].swift
            })
        );
    }

    handleSubmit = () => {
        const data = {
            usdt: this.state.usdt,
            bitcoin: this.state.bitcoin,
            swift: this.state.swift
        };

        this.props.updatePayments(data)
            .then(() => this.setState({
                success: true
            }));
    }

    handleChange = (field) => event => {
        this.setState({
            [field]: event.target.value
        });
    }

    uploadFile = (documentName, file) => {
        const formData = new FormData();

        formData.append(file.name, file);
        formData.append('docName', documentName);

        return this.props.uploadFilesQr(formData);
    };

     handleFileUpload = documentName => event => {
         const file = event.target.files[0];
         event.target.value = '';
         this.uploadFile(documentName, file);
         /* this.setState({
             qr: {
                 [documentName]: {
                     name: file.name,
                     path: `/src/apps/admin/files/${file.name}`
                 }
             }
         }); */
     };

     render () {
         const { classes } = this.props;
         const { usdt, bitcoin, swift, success } = this.state;

         return <div className={styles.root}>
             <div className={styles.row}>
                 <label className={styles.label} >
                    USDT TRC20:
                 </label>
                 <input className={styles.input} type="text" value={usdt} onChange={this.handleChange('usdt')} />
                 <div className={styles.buttonBlock}>
                     <label>
                         <input
                             onChange={this.handleFileUpload('usdt')}
                             accept='image/jpeg,image/png,image/jpg'
                             type='file'
                             className={styles.fileInput}
                         />
                     </label>
                 </div>
             </div>
             <div className={styles.row}>
                 <label className={styles.label} >
                    BTC:
                 </label>
                 <input className={styles.input} type="text" value={bitcoin} onChange={this.handleChange('bitcoin')} />
             </div>
             <div className={styles.row}>
                 <label className={styles.label} >
                    SWIFT:
                 </label>
                 <input className={styles.input} type="text" value={swift} onChange={this.handleChange('swift')} />
             </div>
             <button className={styles.button} onClick={this.handleSubmit}>Сохранить</button>
             {success
                 ? <div className={classes.successBlock}>
                     <SnackbarContent
                         className={classNames(classes.success, classes.margin)}
                         message={
                             <span id='client-snackbar' className={classes.message}>
                                 <CheckCircleIcon className={classNames(classes.icon, classes.iconVariant)} />
                                Смена реквизитов успешна
                             </span>
                         }
                     />
                 </div> : undefined
             }
         </div>;
     }
}

export default connect(null, mapDispatchToProps)(withStyles(materialStyles)(PaymentsPage));
