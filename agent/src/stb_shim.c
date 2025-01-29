// #ifdef AGENT_WASM
//     #ifdef NDEBUG
//     #define	assert(x) (void)0
//     #else
//     #define assert(x) ((void)((x) || (__assert_fail(#x, __FILE__, __LINE__, __func__),0)))
//     #endif // NDEBUG

//     void  __assert_fail (const char *, const char *, int, const char *);
// #else
//     #include <assert.h>
// #endif // AGENT_WASM

typedef typeof(sizeof(0)) size_t; // From: https://en.cppreference.com/w/c/types/size_t

// // void* malloc(size_t);
// // void* realloc(void*, size_t);
// // void  free(void*);

#define QSORT_IMPLEMENTATION
#include "qsort.h"

#define STBRP_SORT qsort
#define STB_RECT_PACK_IMPLEMENTATION
#include "stb/stb_rect_pack.h"

// #define STBIW_MALLOC(sz)        malloc(sz)
// #define STBIW_REALLOC(p,newsz)  realloc(p,newsz)
// #define STBIW_FREE(p)           free(p)
// #define STBIW_ASSERT(x)         assert(x)
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb/stb_image_write.h"

// #define STBTT_malloc(n, u)      ((void)(u),malloc(n))
// #define STBTT_free(x, u)        ((void)(u),free(x))
// #define STBTT_assert(x)         assert(x)
#define STB_TRUETYPE_IMPLEMENTATION
#include "stb/stb_truetype.h"

