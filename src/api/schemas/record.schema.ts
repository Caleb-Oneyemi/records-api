import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RecordFormat, RecordCategory } from './record.enum';

@Schema({ timestamps: true })
export class Record extends Document {
  @Prop({ required: true, lowercase: true })
  artist: string;

  @Prop({ required: true, lowercase: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true })
  category: RecordCategory;

  @Prop({ required: false })
  mbid?: string;

  @Prop({ required: true, type: [String] })
  tracklist: string;
}

export const RecordSchema = SchemaFactory.createForClass(Record);

RecordSchema.index(
  { artist: 1, album: 1, format: 1 },
  { name: 'record_compound_unique_index', unique: true, background: true },
);

RecordSchema.index(
  { artist: 'text', album: 'text', category: 'text' },
  { name: 'record_search_index', background: true },
);

RecordSchema.index({ artist: 1 }, { background: true });
RecordSchema.index({ album: 1 }, { background: true });
RecordSchema.index({ category: 1 }, { background: true });
