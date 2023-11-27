/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object as DataType, Property } from 'fabric-contract-api';

@DataType()
export class UsageRecord {
    @Property('ID', 'string')
    ID = '';

    @Property('Operation', 'string')
    Operation = '';
    @Property('docType', 'string')
    docType = 'usageRecord';
    @Property('Username', 'string')
    UserID = '';

    @Property('Roles', 'string')
    Roles= '';

    @Property('Timestamp', 'string')
    Timestamp = '';


    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<UsageRecord> = {}): UsageRecord {
        return {
            ID: assertHasValue(state.ID, 'Missing ID'),
            docType: 'usageRecord',
            Operation: state.Operation ?? '',
            Roles: state.Roles ?? '',
            Timestamp: state.Timestamp ?? '',
            UserID: assertHasValue(state.UserID, 'Missing Username'),
        };
    }
}

function assertHasValue<T>(value: T | undefined | null, message: string): T {
    if (value == undefined || (typeof value === 'string' && value.length === 0)) {
        throw new Error(message);
    }

    return value;
}
