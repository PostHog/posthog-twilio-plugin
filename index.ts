import { Plugin, Webhook } from '@posthog/plugin-scaffold'

export interface TwilioMetaInput {
    config: {
        accountSID: string
        authToken: string
        triggeringEventsAndNumber: string // Format: eventName:PhoneNumber,eventName:PhoneNumber
        senderPhoneNumber: string
        timeout: string // This should get deprecated since it won't be used going forward
    }
}

const plugin: Plugin<TwilioMetaInput> = {
    composeWebhook: (event, { config }) => {
        const eventAndNumberMap: Record<string, string> = {}

        const eventToNumberPairs = (config.triggeringEventsAndNumber || '').split(',').map((value) => value.trim())

        if (eventToNumberPairs.length === 0) {
            return null
        }

        for (const pair of eventToNumberPairs) {
            const [event, num] = (pair || '').split(':').map((value) => value.trim())
            eventAndNumberMap[event] = num
        }

        if (!(event.event in eventAndNumberMap)) {
            return null
        }

        const number = eventAndNumberMap[event.event]

        return {
            url: `https://api.twilio.com/2010-04-01/Accounts/${config.accountSID}/Messages.json`,
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.accountSID}:${config.authToken}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `Body=Hi ${event.event} occured - PostHog&From=${config.senderPhoneNumber}&To=${number}`,
            method: 'POST',
        } as Webhook
    },
}

export default plugin
