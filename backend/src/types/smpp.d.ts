/* Minimal TypeScript declarations for the `smpp` package used by this project.
   The real `smpp` package does not include official TypeScript types, so we
   provide a focused declaration sufficient for the code in src/services/smpp.ts
   and tests. Avoids using `any` for the main session/PDU shapes. */

import { EventEmitter } from 'events';

declare global {
  namespace smpp {
    interface PDUResponse {
      command_status: number;
      message_id?: string;
    }

    class Session extends EventEmitter {
      constructor(opts?: { host?: string; port?: number; autoConnect?: boolean; tls?: boolean });
      connect(callback?: () => void): void;
      enquire_link(callback: (pdu: PDUResponse) => void): void;
      bind_transceiver(params: Record<string, any>, callback: (pdu: PDUResponse) => void): void;
      submit_sm(params: Record<string, any>, callback: (pdu: PDUResponse) => void): void;
      unbind(callback?: () => void): void;
      close(): void;
    }
  }
}

declare module 'smpp' {
  import { EventEmitter } from 'events';

  export type PDUResponse = smpp.PDUResponse;
  export type Session = smpp.Session;

  const smpp: {
    Session: typeof smpp.Session;
    createServer?: (...args: any[]) => any;
  };

  export default smpp;
}
