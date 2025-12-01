import { FormatOptions } from './options';

export interface Preset {
  id: string;
  name: string;
  location: string;
  format: FormatOptions;
}
