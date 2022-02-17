interface Named {
  id: string;
  name?: string;
  description?: string;
}
export interface Data {
  dataSource?:
    | "DHIS2-SQL-VIEW"
    | "DHIS2-INDICATOR"
    | "DHIS2-DATA-ELEMENT"
    | "OTHER";
}

export interface Numerator extends Data {}
export interface Denominator extends Data {}

export interface Indicator extends Named {
  numerator: Numerator;
  denominator: Denominator;
  factor: number;
}

export interface Visualization extends Named {
  indicator: Indicator;
  type: string;
  ignoreFilter: boolean;
  refreshInterval: number;
}

export interface Section extends Named {
  x: number;
  y: number;
  height: number;
  width: number;
  visualizations: Visualization[];
}

export interface Filter {}

export interface Dashboard extends Named {
  filters: Filter[];
  sections: Section[];
  isDefault: boolean;
}
