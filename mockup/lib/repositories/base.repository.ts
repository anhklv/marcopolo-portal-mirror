/**
 * Repository層のベースインターフェース
 * モックとDB実装の両方で同じインターフェースを使用
 */
export interface IRepository<T> {
  /**
   * すべてのエンティティを取得
   * @param filters フィルター条件（オプション）
   */
  findAll(filters?: any): Promise<T[]>;

  /**
   * IDでエンティティを取得
   * @param id エンティティID
   */
  findById(id: string): Promise<T | null>;

  /**
   * 新しいエンティティを作成
   * @param data 作成するエンティティのデータ
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * エンティティを更新
   * @param id エンティティID
   * @param data 更新するデータ
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * エンティティを削除（論理削除または物理削除）
   * @param id エンティティID
   */
  delete(id: string): Promise<void>;
}

