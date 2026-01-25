
import { EventEmitter } from 'events';
import { IEventBus, SystemEvents } from '../../types/events.js';
import { IDisposable } from '../../types/common.js';

export class EventBus implements IEventBus {
    private emitter = new EventEmitter();

    emit<K extends keyof SystemEvents>(event: K, payload: SystemEvents[K]): void {
        this.emitter.emit(event, payload);
    }

    on<K extends keyof SystemEvents>(event: K, listener: (payload: SystemEvents[K]) => void): IDisposable {
        // Direct pass-through works if payload matches, but EventEmitter listeners often take ...args
        // We ensure strict single argument
        this.emitter.on(event, listener);
        return {
            dispose: () => {
                this.emitter.off(event, listener);
            }
        };
    }
}
