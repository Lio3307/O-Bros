import { describe, expect, it } from 'vitest'
import { parseLsofFields, parseWindowsNetstat, removeDuplicateSockets } from './portParsers'

const NETSTAT_OUTPUT = [
  'Active Connections',
  '',
  '  Proto  Local Address          Foreign Address        State           PID',
  '  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       4120',
  '  TCP    [::]:5173              [::]:0                 LISTENING       4120',
  '  TCP    127.0.0.1:50234        127.0.0.1:3000         ESTABLISHED     999',
  '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1004'
].join('\n')

describe('parseWindowsNetstat', () => {
  it('keeps only listening rows, including IPv6 addresses', () => {
    expect(parseWindowsNetstat(NETSTAT_OUTPUT)).toEqual([
      { port: 3000, pid: 4120 },
      { port: 5173, pid: 4120 },
      { port: 135, pid: 1004 }
    ])
  })
})

describe('parseLsofFields', () => {
  it('pairs each port with the process that owns it', () => {
    const output = ['p4120', 'cnode', 'n*:3000', 'n[::1]:5173', 'p77', 'cpostgres', 'n127.0.0.1:5432', ''].join('\n')
    expect(parseLsofFields(output)).toEqual([
      { port: 3000, pid: 4120 },
      { port: 5173, pid: 4120 },
      { port: 5432, pid: 77 }
    ])
  })
})

describe('removeDuplicateSockets', () => {
  it('collapses the same port listed for IPv4 and IPv6', () => {
    const sockets = [
      { port: 3000, pid: 1 },
      { port: 3000, pid: 1 },
      { port: 3000, pid: 2 }
    ]
    expect(removeDuplicateSockets(sockets)).toHaveLength(2)
  })
})
