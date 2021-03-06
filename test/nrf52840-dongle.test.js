/* Copyright (c) 2010 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY, AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

const path = require('path');
const fs = require('fs');
const { getNordicUsbDevice } = require('./util/common');
const { setupDevice, ensureBootloaderMode } = require('../');

jest.setTimeout(50000);

const RSSI_OPTIONS = {
    dfu: {
        pca10059: {
            application: path.resolve(__dirname, '../bin/fw/rssi-10059.hex'),
            semver: 'rssi_cdc_acm 2.0.0+dfuMay-22-2018-10-43-22',
        },
    },
};

const CONNECTIVITY_OPTIONS = {
    dfu: {
        pca10059: {
            application: fs.readFileSync(path.resolve(__dirname, '../bin/fw/connectivity_4.1.0_usb_for_s132_5.1.0.hex')),
            softdevice: fs.readFileSync(path.resolve(__dirname, '../bin/fw/s132_nrf52_5.1.0_softdevice.hex')),
            semver: 'ble-connectivity 4.1.0+Mar-21-2019-07-43-03',
            params: {
                hwVersion: 52,
                fwVersion: 0xffffffff,
                sdReq: [0],
                sdId: [0xA5],
            },
        },
    },
    detailedOutput: true,
};

const serialNumber = process.env.DONGLE_SERIAL_NUMBER;
const testcase = serialNumber ? it : it.skip;

describe('nrf52840 dongle', () => {
    testcase('is programmed when firmware is not present, but skips programming when firmware is already present', () => (
        getNordicUsbDevice(serialNumber)
            .then(device => setupDevice(device, RSSI_OPTIONS))
            .then(device => setupDevice(device, CONNECTIVITY_OPTIONS))
            .then(result => {
                expect(result.details.wasProgrammed).toEqual(true);
                return result.device;
            })
            .then(device => setupDevice(device, CONNECTIVITY_OPTIONS))
            .then(result => expect(result.details.wasProgrammed).toEqual(false))
    ));

    testcase('is set back to bootloader mode', async () => {
        const device = await getNordicUsbDevice(serialNumber);
        const result = await ensureBootloaderMode(device);
        expect(result.serialNumber).toMatch(device.serialNumber);
    });
});
