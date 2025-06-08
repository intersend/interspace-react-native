import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Apple's exact grid specifications
export const GRID_CONFIG = {
  COLUMNS: 4,
  ROWS: 6, // 6 rows per page (excluding dock)
  ICON_SIZE: 60,
  FOLDER_SIZE: 120, // 2x2 grid
  HORIZONTAL_PADDING: 27,
  VERTICAL_PADDING: 35,
  TOP_OFFSET: 100, // Space for search widget
  LABEL_HEIGHT: 20,
  VERTICAL_SPACING: 16,
  get HORIZONTAL_SPACING() {
    return (width - this.HORIZONTAL_PADDING * 2 - this.ICON_SIZE * this.COLUMNS) / (this.COLUMNS - 1);
  },
  get CELL_WIDTH() {
    return this.ICON_SIZE + this.HORIZONTAL_SPACING;
  },
  get CELL_HEIGHT() {
    return this.ICON_SIZE + this.LABEL_HEIGHT + this.VERTICAL_SPACING;
  },
};

export interface GridPosition {
  page: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

export interface GridItem {
  id: string;
  type: 'app' | 'folder';
  position: GridPosition;
  size: { width: number; height: number }; // 1x1 for apps, 2x2 for folders
}

export class IOSGridLayoutManager {
  private grid: (string | null)[][][] = []; // [page][row][col]
  private items: Map<string, GridItem> = new Map();
  
  constructor() {
    this.initializeGrid();
  }

  private initializeGrid(pages: number = 1) {
    this.grid = [];
    for (let page = 0; page < pages; page++) {
      this.grid[page] = [];
      for (let row = 0; row < GRID_CONFIG.ROWS; row++) {
        this.grid[page][row] = [];
        for (let col = 0; col < GRID_CONFIG.COLUMNS; col++) {
          this.grid[page][row][col] = null;
        }
      }
    }
  }

  private expandGrid() {
    const newPage = this.grid.length;
    this.grid[newPage] = [];
    for (let row = 0; row < GRID_CONFIG.ROWS; row++) {
      this.grid[newPage][row] = [];
      for (let col = 0; col < GRID_CONFIG.COLUMNS; col++) {
        this.grid[newPage][row][col] = null;
      }
    }
  }

  private isPositionAvailable(page: number, row: number, col: number, width: number, height: number): boolean {
    // Check bounds
    if (row + height > GRID_CONFIG.ROWS || col + width > GRID_CONFIG.COLUMNS) {
      return false;
    }

    // Check if all required cells are empty
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (this.grid[page]?.[r]?.[c] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  private occupyPosition(itemId: string, page: number, row: number, col: number, width: number, height: number) {
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        this.grid[page][r][c] = itemId;
      }
    }
  }

  private clearPosition(itemId: string) {
    for (let page = 0; page < this.grid.length; page++) {
      for (let row = 0; row < GRID_CONFIG.ROWS; row++) {
        for (let col = 0; col < GRID_CONFIG.COLUMNS; col++) {
          if (this.grid[page][row][col] === itemId) {
            this.grid[page][row][col] = null;
          }
        }
      }
    }
  }

  private findNextAvailablePosition(width: number, height: number): GridPosition | null {
    for (let page = 0; page < this.grid.length; page++) {
      for (let row = 0; row < GRID_CONFIG.ROWS; row++) {
        for (let col = 0; col < GRID_CONFIG.COLUMNS; col++) {
          if (this.isPositionAvailable(page, row, col, width, height)) {
            return {
              page,
              row,
              col,
              x: this.calculateX(page, col),
              y: this.calculateY(row),
            };
          }
        }
      }
    }

    // No space found, expand grid
    this.expandGrid();
    return {
      page: this.grid.length - 1,
      row: 0,
      col: 0,
      x: this.calculateX(this.grid.length - 1, 0),
      y: this.calculateY(0),
    };
  }

  private calculateX(page: number, col: number): number {
    return page * width + GRID_CONFIG.HORIZONTAL_PADDING + col * GRID_CONFIG.CELL_WIDTH;
  }

  private calculateY(row: number): number {
    return GRID_CONFIG.TOP_OFFSET + row * GRID_CONFIG.CELL_HEIGHT;
  }

  public addItem(id: string, type: 'app' | 'folder', preferredPosition?: { page: number; row: number; col: number }): GridPosition {
    const size = type === 'folder' ? { width: 2, height: 2 } : { width: 1, height: 1 };
    
    let position: GridPosition;
    
    if (preferredPosition && this.isPositionAvailable(
      preferredPosition.page,
      preferredPosition.row,
      preferredPosition.col,
      size.width,
      size.height
    )) {
      position = {
        ...preferredPosition,
        x: this.calculateX(preferredPosition.page, preferredPosition.col),
        y: this.calculateY(preferredPosition.row),
      };
    } else {
      const found = this.findNextAvailablePosition(size.width, size.height);
      if (!found) throw new Error('No available position');
      position = found;
    }

    this.occupyPosition(id, position.page, position.row, position.col, size.width, size.height);
    
    this.items.set(id, {
      id,
      type,
      position,
      size,
    });

    return position;
  }

  public removeItem(id: string) {
    this.clearPosition(id);
    this.items.delete(id);
  }

  public moveItem(id: string, newPage: number, newRow: number, newCol: number): boolean {
    const item = this.items.get(id);
    if (!item) return false;

    // Clear old position
    this.clearPosition(id);

    // Check if new position is available
    if (this.isPositionAvailable(newPage, newRow, newCol, item.size.width, item.size.height)) {
      // Occupy new position
      this.occupyPosition(id, newPage, newRow, newCol, item.size.width, item.size.height);
      
      // Update item position
      item.position = {
        page: newPage,
        row: newRow,
        col: newCol,
        x: this.calculateX(newPage, newCol),
        y: this.calculateY(newRow),
      };
      
      return true;
    } else {
      // Restore old position if move failed
      this.occupyPosition(
        id,
        item.position.page,
        item.position.row,
        item.position.col,
        item.size.width,
        item.size.height
      );
      return false;
    }
  }

  public getItemsForPage(page: number): GridItem[] {
    const pageItems: GridItem[] = [];
    this.items.forEach(item => {
      if (item.position.page === page) {
        pageItems.push(item);
      }
    });
    return pageItems;
  }

  public getAllItems(): GridItem[] {
    return Array.from(this.items.values());
  }

  public getPageCount(): number {
    return this.grid.length;
  }

  public findDropTarget(x: number, y: number): { page: number; row: number; col: number } | null {
    const page = Math.floor(x / width);
    const pageX = x - page * width;
    
    const col = Math.floor((pageX - GRID_CONFIG.HORIZONTAL_PADDING) / GRID_CONFIG.CELL_WIDTH);
    const row = Math.floor((y - GRID_CONFIG.TOP_OFFSET) / GRID_CONFIG.CELL_HEIGHT);
    
    if (col >= 0 && col < GRID_CONFIG.COLUMNS && row >= 0 && row < GRID_CONFIG.ROWS) {
      return { page, row, col };
    }
    
    return null;
  }

  public canCreateFolder(appId: string, targetId: string): boolean {
    const app = this.items.get(appId);
    const target = this.items.get(targetId);
    
    return app?.type === 'app' && target?.type === 'app';
  }

  public reorganizeItems(items: Array<{ id: string; type: 'app' | 'folder' }>): Map<string, GridPosition> {
    // Clear grid and items
    this.initializeGrid();
    this.items.clear();
    
    const positions = new Map<string, GridPosition>();
    
    // Add items in order
    items.forEach(item => {
      const position = this.addItem(item.id, item.type);
      positions.set(item.id, position);
    });
    
    return positions;
  }
}
