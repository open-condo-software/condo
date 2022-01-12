// TODO(zuch): remove after tests will have obs configuration in .env
const isObsConfigured = () => {
    const S3Config = {
        ...(process.env.SBERCLOUD_OBS_CONFIG ? JSON.parse(process.env.SBERCLOUD_OBS_CONFIG) : {}),
    }
    return !!S3Config.bucket
}

module.exports = isObsConfigured
