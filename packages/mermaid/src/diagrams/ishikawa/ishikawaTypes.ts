export interface IshikawaNode {
  text: string;
  children: IshikawaNode[];
  eliminated?: boolean;
}
