import { Event } from './event.model';

export class Resource {
  name: string;
  user:any;
  type: string;
  asset: any;
  events: Event[];
}