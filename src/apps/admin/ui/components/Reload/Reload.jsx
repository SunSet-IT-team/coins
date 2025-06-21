import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';

const ReloadingStatus = {
    Default: 'default',
    Processing: 'processing',
    Reloaded: 'reloaded',
};

const Reload = () => {
    const [reloadingStatus, setReloadingStatus] = useState(ReloadingStatus.Default);
    const [message, setMessage] = useState('');

    const handleRedeploy = async () => {
        console.log('Запуск пересборки');
        setMessage('Перезагрузка с пересборкой... Примерно через минуту обновите страницу.');
        setReloadingStatus(ReloadingStatus.Processing);
        await fetch('/api/redeploy', {
            method: 'POST',
        });
        setReloadingStatus(ReloadingStatus.Reloaded);
        window.location.reload();
    };

    const handleReload = async () => {
        console.log('Запуск быстрой перезагрузки');
        setMessage('Быстрая перезагрузка, примерно 10 секунд...');
        setReloadingStatus(ReloadingStatus.Processing);
        await fetch('/api/reload', {
            method: 'POST',
        });
        setReloadingStatus(ReloadingStatus.Reloaded);
        window.location.reload();
    };

    return (
        <React.Fragment>
            <Toolbar z-index={0}>
                {reloadingStatus === ReloadingStatus.Default ? (
                    <Button
                        onClick={handleRedeploy}
                        variant="contained"
                        color="secondary"
                        margin="normal"
                        fullWidth
                    >
                        Пересобрать и перезагрузить
                    </Button>
                ) : (
                    <React.Fragment>
                        <center>
                            <p>{message}</p>
                        </center>
                    </React.Fragment>
                )}
            </Toolbar>
            <Toolbar z-index={0}>
                {reloadingStatus === ReloadingStatus.Default ? (
                    <Button
                        onClick={handleReload}
                        variant="contained"
                        color="primary"
                        margin="normal"
                        fullWidth
                    >
                        Быстрая перезагрузка
                    </Button>
                ) : (
                    <React.Fragment></React.Fragment>
                )}
            </Toolbar>
        </React.Fragment>
    );
};

export default Reload;
