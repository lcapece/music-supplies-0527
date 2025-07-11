import React, { useState, useEffect } from 'react';
import { ProductGroup } from '../types';
import { ChevronDown, ChevronRight, Drum, Guitar, Piano, Book, Cable, Mic, Briefcase, Settings, Music2 as MusicStand, Music as Maracas, Blinds, Music4, HardDrive } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface CategorySelection {
  id: string;
  namePath: string[]; // Path of names from root to selected category
  level: number;
}
interface CategoryTreeProps {
  onSelectCategory: (selection: CategorySelection | null) => void; // Updated to pass object or null for deselection
  selectedCategoryId: string | null;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  
  // Map category names to their corresponding icons
  if (name.includes('electronics')) {
    return <HardDrive size={24} className="text-red-600" />;
  }
  if (name.includes('accessories') || name.includes('supplies')) {
    return <Cable size={24} className="text-red-600" />;
  }
  if (name.includes('amps') || name.includes('mics') || name.includes('pa')) {
    return <Mic size={24} className="text-red-600" />;
  }
  if (name.includes('bags') || name.includes('cases')) {
    return <Briefcase size={24} className="text-red-600" />;
  }
  if (name.includes('electronics')) {
    return <Settings size={24} className="text-red-600" />;
  }
  if (name.includes('guitar')) {
    return <Guitar size={24} className="text-red-600" />;
  }
  if (name.includes('hardware')) {
    return <MusicStand size={24} className="text-red-600" />;
  }
  if (name.includes('keyboard') || name.includes('accordion') || name.includes('ethnic')) {
    return <Piano size={24} className="text-red-600" />;
  }
  if (name.includes('media')) {
    return <Book size={24} className="text-red-600" />;
  }
  if (name.includes('percussion') || name.includes('drum')) {
    return <Drum size={24} className="text-red-600" />;
  }
  if (name.includes('small instruments')) {
    return <Maracas size={24} className="text-red-600" />;
  }
  if (name.includes('violin') || name.includes('viola') || name.includes('cello') || name.includes('string')) {
    return <Blinds size={24} className="text-red-600" />;
  }
  if (name.includes('woodwind') || name.includes('brass')) {
    return <Music4 size={24} className="text-red-600" />;
  }
  
  return <Maracas size={24} className="text-red-600" />;
};

const CategoryTreeItem: React.FC<{
  category: ProductGroup;
  level: number;
  onSelectCategory: (selection: CategorySelection) => void; // Updated
  selectedCategoryId: string | null;
  currentNamePath: string[]; // Added to pass down the path
}> = ({ category, level, onSelectCategory, selectedCategoryId, currentNamePath }) => {
  // Initial expansion: expand level 1 if a category is selected, otherwise start collapsed.
  const [isExpanded, setIsExpanded] = useState(selectedCategoryId !== null && level === 1); // Default L1 expanded if a category selection exists
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;

  useEffect(() => {
    // If a specific category is selected, ensure its ancestors are expanded.
    // This does not force collapse when selectedCategoryId is null.
    if (selectedCategoryId !== null) {
      if (category.id && selectedCategoryId.startsWith(category.id) && category.id !== selectedCategoryId) {
        setIsExpanded(true); // Expand ancestors if a specific category is selected.
      }
    }
    // When selectedCategoryId is null (All Products), this effect does not alter isExpanded.
    // The initial state (useState) will make items start collapsed if selectedCategoryId is null.
    // User's manual expansions will be preserved if they switch to "All Products" and then back to a category,
    // unless the item is an ancestor of the new selection (then it's forced open) or it's L1 (initial state).
  }, [selectedCategoryId, category.id, level]); // level added back just in case, though it's const for the instance.
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const handleSelect = () => {
    const newNamePath = [...currentNamePath, category.name];
    onSelectCategory({ id: category.id, namePath: newNamePath, level: category.level });
  };
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-100' : ''}`}
        onClick={handleSelect}
        style={{ paddingLeft: `${(level - 1) * 20 + 12}px` }}
      >
        {hasChildren ? (
          <span onClick={handleToggle} className="mr-2">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </span>
        ) : (
          <span className="mr-2 w-5"></span>
        )}
        <span className="mr-3">
          {level === 1 ? getCategoryIcon(category.name) : null}
        </span>
        <span className={`text-base truncate ${level === 2 ? 'text-blue-600' : ''}`}>
          {category.name}
        </span>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {category.children?.map(child => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onSelectCategory={onSelectCategory}
              selectedCategoryId={selectedCategoryId}
              currentNamePath={[...currentNamePath, category.name]} // Pass updated path
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  onSelectCategory,
  selectedCategoryId
}) => {
  const [categories, setCategories] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('lcmd_product_subgroups')
          .select('prdmetagrp, prdmaingrp, prdsubgrp')
          .order('prdmetagrp, prdmaingrp, prdsubgrp');

        if (error) throw error;

        // Build tree structure
        const tree: ProductGroup[] = [];
        const metaGroups = new Map<string, ProductGroup>();
        const mainGroups = new Map<string, ProductGroup>();

        // Process meta groups (level 1)
        data?.forEach(row => {
          if (row.prdmetagrp && !metaGroups.has(row.prdmetagrp)) {
            const group: ProductGroup = {
              id: `meta_${row.prdmetagrp}`,
              name: row.prdmetagrp,
              level: 1,
              parentId: null,
              children: [],
              prdmetagrp: row.prdmetagrp
            };
            metaGroups.set(row.prdmetagrp, group);
            tree.push(group);
          }
        });

        // Process main groups (level 2)
        data?.forEach(row => {
          if (row.prdmetagrp && row.prdmaingrp) {
            const key = `${row.prdmetagrp}_${row.prdmaingrp}`;
            if (!mainGroups.has(key)) {
              const group: ProductGroup = {
                id: `main_${key}`,
                name: row.prdmaingrp,
                level: 2,
                parentId: `meta_${row.prdmetagrp}`,
                children: [],
                prdmaingrp: row.prdmaingrp
              };
              mainGroups.set(key, group);
              metaGroups.get(row.prdmetagrp)?.children?.push(group);
            }
          }
        });

        // Process sub groups (level 3)
        data?.forEach(row => {
          if (row.prdmetagrp && row.prdmaingrp && row.prdsubgrp) {
            const mainKey = `${row.prdmetagrp}_${row.prdmaingrp}`;
            const mainGroup = mainGroups.get(mainKey);
            if (mainGroup) {
              const subGroup: ProductGroup = {
                id: `sub_${row.prdmetagrp}_${row.prdmaingrp}_${row.prdsubgrp}`,
                name: row.prdsubgrp,
                level: 3,
                parentId: mainGroup.id,
                prdsubgrp: row.prdsubgrp
              };
              mainGroup.children = mainGroup.children || [];
              mainGroup.children.push(subGroup);
            }
          }
        });

        setCategories(tree);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto w-full flex flex-col"> {/* Changed height and width, added flex flex-col */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10"> {/* Made header sticky */}
        <h3 className="font-medium text-gray-700">Product Categories</h3>
      </div>
      <div className="p-2 flex-grow overflow-y-auto"> {/* Made content area scrollable and grow */}
        {categories.map(category => (
          <CategoryTreeItem
            key={category.id}
            category={category}
            level={1} // Top level items
            onSelectCategory={onSelectCategory}
            selectedCategoryId={selectedCategoryId}
            currentNamePath={[]} // Initial path is empty for root items
          />
        ))}
         <div 
          className="flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 mt-2 border-t pt-3"
          onClick={() => onSelectCategory(null)} // Call with null to deselect
        >
          <span className="mr-2 w-5"></span> {/* Spacer */}
          <span className="text-base text-gray-600 italic">Show All Products</span>
        </div>
      </div>
    </div>
  );
};

export default CategoryTree;
