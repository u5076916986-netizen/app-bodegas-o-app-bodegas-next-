declare module "papaparse" {
  export type ParseError = {
    code: string;
    message: string;
    row: number;
  };

  export type ParseMeta = {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };

  export type ParseConfig = {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
  };

  export type ParseResult<T> = {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  };

  export interface PapaparseStatic {
    parse<T = any>(input: string, config?: ParseConfig): ParseResult<T>;
    unparse<T = any>(data: T[] | object, config?: { quotes?: boolean }): string;
  }

  const Papa: PapaparseStatic;
  export default Papa;
}
