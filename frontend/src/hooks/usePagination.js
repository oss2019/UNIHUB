import { useState, useMemo } from 'react';

export default function usePagination(items = [], itemsPerPage = 15) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      totalItems: items.length,
      currentItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    const maxPage = Math.ceil(items.length / itemsPerPage);
    if (page >= 1 && page <= maxPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    ...paginationData,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage,
  };
}
