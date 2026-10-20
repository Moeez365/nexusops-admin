import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { deleteCollection, getCollections } from "../api/collections";
import ListFilterToolbar, {
  ToolbarSelect,
} from "../components/ListFilterToolbar";
import { ConfirmModal, StatusBadge } from "../components/common";

function Collection() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    active: 0,
    draft: 0,
    has_products: 0,
    empty: 0,
  });
  const [loadedImages, setLoadedImages] = useState([]);
  const [failedCoverImages, setFailedCoverImages] = useState(() => new Set());
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const markImageLoaded = (key) => {
    if (!key) return;
    setLoadedImages((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  // Debounce search query input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch filtered collections from backend
  useEffect(() => {
    let ignore = false;
    async function fetchCollection() {
      try {
        setLoading(true);
        const res = await getCollections({
          search: debouncedSearchQuery,
          status: statusTab,
          sortBy,
        });
        if (!ignore) {
          setCollections(res.data ?? []);
          if (res.tabCounts) {
            setTabCounts(res.tabCounts);
          }
        }
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchCollection();
    return () => {
      ignore = true;
    };
  }, [debouncedSearchQuery, statusTab, sortBy]);

  const collectionTabs = useMemo(
    () => [
      { id: "all", label: "All", count: tabCounts.all },
      { id: "active", label: "Active", count: tabCounts.active },
      { id: "draft", label: "Draft", count: tabCounts.draft },
      {
        id: "has_products",
        label: "With products",
        count: tabCounts.has_products,
      },
      { id: "empty", label: "Empty", count: tabCounts.empty },
    ],
    [tabCounts],
  );

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "products_desc", label: "Products: high to low" },
    { value: "products_asc", label: "Products: low to high" },
    { value: "name_asc", label: "Name: A to Z" },
  ];

  const statusSelectOptions = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active only" },
    { value: "draft", label: "Draft only" },
    { value: "has_products", label: "With products" },
    { value: "empty", label: "Empty" },
  ];

  const hasActiveFilters =
    statusTab !== "all" || Boolean(searchQuery.trim()) || sortBy !== "newest";

  const handleResetFilters = () => {
    setStatusTab("all");
    setSearchQuery("");
    setSortBy("newest");
  };

  // Collections are already filtered and sorted by backend
  const filteredCollections = collections;

  const handleEditCollection = (id) => {
    if (!id) return;
    navigate(`/collections/add-collection?id=${encodeURIComponent(id)}`);
  };

  const handleViewProducts = (id) => {
    if (!id) return;
    navigate(`/inventory?collection=${encodeURIComponent(id)}`);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete?._id || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteCollection(collectionToDelete._id);
      setCollections((prev) =>
        prev.filter((item) => item._id !== collectionToDelete._id),
      );
      setTabCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
        ...(collectionToDelete.isActive === false
          ? { draft: Math.max(0, prev.draft - 1) }
          : { active: Math.max(0, prev.active - 1) }),
      }));
      setCollectionToDelete(null);
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete collection. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Collections"
        buttonLabel="Add Collection"
        buttonTo="/collections/add-collection"
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-label-mono text-label-mono uppercase tracking-[0.25em] text-primary">
                Product organization
              </span>
              <h2 className="mt-2 font-headline-lg text-headline-lg">
                Collections
              </h2>
              <p className="mt-1 font-body-base text-body-base text-on-surface-variant">
                Manage your luxury product collections and their inventory.
              </p>
            </div>
            <div className="flex items-center gap-2 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {tabCounts.all} total collections
            </div>
          </div>

          <ListFilterToolbar
            tabs={collectionTabs}
            activeTab={statusTab}
            onTabChange={setStatusTab}
            searchPlaceholder="Search collections by name, description, or slug..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalFilteredCount={filteredCollections.length}
            totalCount={tabCounts.all}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
          >
            <ToolbarSelect
              ariaLabel="Filter collection status"
              value={statusTab}
              onChange={setStatusTab}
              options={statusSelectOptions}
            />
            <ToolbarSelect
              ariaLabel="Sort collections"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
          </ListFilterToolbar>

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container/70 text-on-surface-variant shadow-[0_16px_45px_rgba(50,35,75,0.10)]">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                progress_activity
              </span>
              <p className="mt-3 font-label-mono text-[10px] uppercase tracking-widest">
                Loading collections
              </p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container/40 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-primary/50">
                collections_bookmark
              </span>
              <h3 className="mt-3 font-title-md text-title-md text-on-surface">
                {collections.length === 0
                  ? "No collections created yet"
                  : "No matching collections"}
              </h3>
              <p className="mt-1 text-body-base text-on-surface-variant">
                {collections.length === 0
                  ? "Create your first curated collection to organize your catalog."
                  : "Try adjusting your search query or status filter."}
              </p>
              {collections.length === 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/collections/add-collection")}
                  className="mt-4 flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-title-md text-sm text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.16)] transition-all hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add
                  </span>
                  Create Collection
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCollections.map((collection) => {
                const collectionId = collection._id ?? collection.name;
                const coverImageUrl = collection.image?.url;
                const hasCoverImage =
                  Boolean(coverImageUrl) &&
                  !failedCoverImages.has(collectionId);
                const itemCount =
                  collection.itemCount ?? collection.products?.length ?? 0;

                return (
                  <article
                    key={collectionId}
                    onClick={() => handleEditCollection(collection._id)}
                    className="group relative h-72 cursor-pointer overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container shadow-[0_16px_45px_rgba(50,35,75,0.12)]"
                  >
                    {hasCoverImage ? (
                      <div className="absolute inset-0 overflow-hidden bg-surface-container-high">
                        <img
                          src={coverImageUrl}
                          alt={`${collection.name} collection`}
                          onLoad={() => markImageLoaded(collectionId)}
                          onError={() =>
                            setFailedCoverImages((previousImages) => {
                              const nextImages = new Set(previousImages);
                              nextImages.add(collectionId);
                              return nextImages;
                            })
                          }
                          className={`h-full w-full object-cover ${
                            loadedImages.includes(collectionId)
                              ? "opacity-100 transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none"
                              : "media-image-loading opacity-0"
                          }`}
                        />
                      </div>
                    ) : (
                      <div
                        role="img"
                        aria-label={`${collection.name} collection has no cover image`}
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-container via-surface-container-high to-secondary-container"
                      >
                        <span className="material-symbols-outlined text-[88px] text-primary/35 transition-transform duration-700 group-hover:scale-110">
                          collections_bookmark
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <StatusBadge
                        status={collection.isActive === false ? "draft" : "active"}
                        label={collection.isActive === false ? "Scheduled" : "Online"}
                        size="sm"
                      />
                    </div>

                    <button
                      type="button"
                      aria-label={`Delete ${collection.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteError("");
                        setCollectionToDelete(collection);
                      }}
                      className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/80 backdrop-blur-md transition-colors hover:bg-error hover:text-on-error"
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        delete
                      </span>
                    </button>

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <span className="mb-2 inline-flex rounded-full border border-white/15 bg-primary-container/90 px-3 py-1 font-label-mono text-[10px] uppercase tracking-widest text-on-primary-container backdrop-blur-md">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>

                      <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate font-headline-lg text-2xl text-white">
                            {collection.name}
                          </h3>
                          {collection.description && (
                            <p className="mt-0.5 truncate text-xs text-white/75">
                              {collection.description}
                            </p>
                          )}
                        </div>

                        <div
                          className="flex shrink-0 gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Edit ${collection.name}`}
                            onClick={() => handleEditCollection(collection._id)}
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              edit
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label={`View products in ${collection.name}`}
                            onClick={() => handleViewProducts(collection._id)}
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:bg-primary/90 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              inventory_2
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={Boolean(collectionToDelete)}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this collection?"
        subtitle="Confirm deletion"
        message={`This will permanently delete ${collectionToDelete?.name}. Assigned products will remain in your inventory.`}
        itemName={collectionToDelete?.name}
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        isLoading={isDeleting}
        error={deleteError}
      />
    </>
  );
}

export default Collection;
