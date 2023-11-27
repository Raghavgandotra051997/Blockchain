/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object as DataType, Property } from 'fabric-contract-api';

@DataType()
export class Case {
    @Property('ID', 'string')
    ID = '';
    @Property('docType', 'string')
    docType = 'case';
    @Property('TestResults', 'string')
    TestResults = '';

    @Property('Diagnosis', 'string')
    Diagnosis = '';

    @Property('Treatments', 'string')
    Treatments= '';


    constructor() {
        // Nothing to do
    }

    static newInstance(state: Partial<Case> = {}): Case {
        return {
            ID: assertHasValue(state.ID, 'Missing ID'),
            docType: 'case',
            TestResults: state.TestResults ?? '',
            Diagnosis: state.Diagnosis ?? '',
            Treatments: state.Treatments ?? '',
        };
    }
}

function assertHasValue<T>(value: T | undefined | null, message: string): T {
    if (value == undefined || (typeof value === 'string' && value.length === 0)) {
        throw new Error(message);
    }

    return value;
}
