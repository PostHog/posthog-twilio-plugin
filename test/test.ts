import { Meta, PostHogEvent } from '@posthog/plugin-scaffold'

import plugin, { TwilioMetaInput } from '../index'

const { composeWebhook } = plugin

const meta: Meta<TwilioMetaInput> = {
    attachments: {},
    cache: {
        set: async () => {
            //
        },
        get: async () => {
            //
        },
        incr: async () => 1,
        expire: async () => true,
        lpush: async () => 1,
        lrange: async () => [],
        llen: async () => 1,
        lpop: async () => [],
        lrem: async () => 1,
    },
    config: {
        accountSID: 'account-sid',
        authToken: 'auth-token',
        triggeringEventsAndNumber: '$identify:+14155551212,my-event:+12025551212', // Format: eventName:PhoneNumber,eventName:PhoneNumber
        senderPhoneNumber: '+3312345678',
        timeout: '1', // This should get deprecated since it won't be used going forward
    },
    geoip: {
        locate: async () => null,
    },
    global: {},
    jobs: {},
    metrics: {},
    storage: {
        set: async () => {
            //
        },
        get: async () => {
            //
        },
        del: async () => {
            //
        },
    },
    utils: {
        cursor: {
            init: async () => {
                //
            },
            increment: async () => 1,
        },
    },
}

const mockEvent: PostHogEvent = {
    uuid: '10000000-0000-4000-0000-000000000000',
    team_id: 1,
    distinct_id: '1234',
    event: 'my-event',
    timestamp: new Date(),
    properties: {
        $ip: '127.0.0.1',
        $elements_chain: 'div:nth-child="1"nth-of-type="2"text="text"',
        foo: 'bar',
    },
}

const mockIdentifyEvent: PostHogEvent = {
    uuid: '10000000-0000-4000-0000-000000000000',
    team_id: 1,
    distinct_id: '1234',
    event: '$identify',
    timestamp: new Date(),
    properties: {
        $ip: '127.0.0.1',
        $elements_chain: 'div:nth-child="1"nth-of-type="2"text="text"',
        foo: 'bar',
    },
}

describe('plugin tests', () => {
    test('return null on empty eventToNumberPairs', () => {
        if (!composeWebhook) {
            throw new Error('Not implemented')
        }

        const metaWithBadEventToNumberPairs: Meta<TwilioMetaInput> = {
            ...meta,
            config: { ...meta.config, triggeringEventsAndNumber: '' },
        }

        expect(composeWebhook(mockEvent, metaWithBadEventToNumberPairs)).toBeNull()
    })

    test('return null on event not in triggeringEventsAndNumber', async () => {
        if (!composeWebhook) {
            throw new Error('Not implemented')
        }

        const unknownEvent: PostHogEvent = { ...mockEvent, event: 'i-am-an-unknown-event' }

        expect(composeWebhook(unknownEvent, meta)).toBeNull()
    })

    test('return expected webhook object', async () => {
        if (!composeWebhook) {
            throw new Error('Not implemented')
        }

        const basicToken = Buffer.from('account-sid:auth-token').toString('base64')

        const webhook1 = composeWebhook(mockEvent, meta)
        expect(webhook1).toHaveProperty('url', 'https://api.twilio.com/2010-04-01/Accounts/account-sid/Messages.json')
        expect(webhook1?.headers).toMatchObject({
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicToken}`,
        })
        expect(webhook1).toHaveProperty('method', 'POST')
        expect(webhook1).toHaveProperty('body', 'Body=Hi my-event occurred - PostHog&From=+3312345678&To=+12025551212')

        const webhook2 = composeWebhook(mockIdentifyEvent, meta)
        expect(webhook2).toHaveProperty('url', 'https://api.twilio.com/2010-04-01/Accounts/account-sid/Messages.json')
        expect(webhook2?.headers).toMatchObject({
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicToken}`,
        })
        expect(webhook2).toHaveProperty('method', 'POST')
        expect(webhook2).toHaveProperty('body', 'Body=Hi $identify occurred - PostHog&From=+3312345678&To=+14155551212')
    })
})
