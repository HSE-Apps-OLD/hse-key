const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient()

exports.config = {}

exports.setConfig = async () => {
    try{    


        const [config] = await client.accessSecretVersion({name: 'projects/key-hse/secrets/CONFIG/versions/latest'})
        const [sgKey] = await client.accessSecretVersion({name: 'projects/key-hse/secrets/SG_KEY/versions/latest'})

        const temp = JSON.parse(config.payload.data)

        exports.config = {...temp, SG_KEY: sgKey.payload.data.toString()}

    } catch(err) {
        console.log(err)
    }
}
