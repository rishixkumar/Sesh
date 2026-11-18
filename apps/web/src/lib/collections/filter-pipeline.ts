export type Predicate<T> = (item: T) => boolean;

/**
 * Ordered AND-composition of named predicates. Stages run in insertion order
 * and short-circuit on the first rejection, so put cheap, selective stages
 * first. Immutable: `where` returns a new pipeline.
 */
export class FilterPipeline<T> {
  private constructor(
    private readonly stages: ReadonlyArray<{
      name: string;
      test: Predicate<T>;
    }>
  ) {}

  static empty<T>(): FilterPipeline<T> {
    return new FilterPipeline<T>([]);
  }

  where(name: string, test: Predicate<T>): FilterPipeline<T> {
    return new FilterPipeline([...this.stages, { name, test }]);
  }

  /** Adds the stage only when `enabled`, keeping inactive filters free. */
  whereIf(enabled: boolean, name: string, test: Predicate<T>): FilterPipeline<T> {
    return enabled ? this.where(name, test) : this;
  }

  get stageNames(): string[] {
    return this.stages.map((s) => s.name);
  }

  test(item: T): boolean {
    for (const stage of this.stages) {
      if (!stage.test(item)) return false;
    }
    return true;
  }

  apply(items: Iterable<T>): T[] {
    const kept: T[] = [];
    for (const item of items) {
      if (this.test(item)) kept.push(item);
    }
    return kept;
  }
}
