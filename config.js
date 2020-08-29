const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient()

exports.config = {}

exports.setConfig = async () => {

    try{
        const [config] = await client.accessSecretVersion({name: 'projects/key-hse/secrets/CONFIG/versions/latest'})

        exports.config = JSON.parse(config.payload.data)

    } catch(err) {
        console.log(err)
    }
}
