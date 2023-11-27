/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object as DataType, Property } from 'fabric-contract-api';
import { Case } from './case';
@DataType()
export class Patient {
    @Property('ID', 'string')
    ID = '';
    @Property('docType', 'string')
    docType = 'patient';
    @Property('Name', 'string')
    Name = '';

    @Property('Username', 'string')
    Username = '';

    @Property('AuthorizedDoctors', 'string[]')
    AuthorizedDoctors: string[] = [];

    @Property('Address', 'string')
    Address = '';

    @Property('PhoneNo', 'string')
    PhoneNo = '';

    @Property('Cases', 'Case[]')
    Cases: Case[] = [];


    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<Patient> = {}): Patient {
        return {
            ID: assertHasValue(state.ID, 'Missing ID'),
            docType: 'patient',
            Name: state.Name ?? '',
            Address: state.Address ?? '',
            AuthorizedDoctors: state.AuthorizedDoctors ?? [],
            Username: state.Username ?? '',
            PhoneNo: state.PhoneNo ?? '',
            Cases: state.Cases ?? [],
        };
    }
}

function assertHasValue<T>(value: T | undefined | null, message: string): T {
    if (value == undefined || (typeof value === 'string' && value.length === 0)) {
        throw new Error(message);
    }

    return value;
}
