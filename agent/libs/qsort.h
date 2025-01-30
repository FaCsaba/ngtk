#ifndef QSORT_H
#define QSORT_H

void qsort(void * v, size_t count, size_t _size, int (*comp)(const void*,const void*));

#ifdef QSORT_IMPLEMENTATION

#include <stddef.h>
#include <string.h>

void swap(void *a, void *b, size_t size) {
    unsigned char temp[size];
    memcpy(temp, a, size);
    memcpy(a, b, size);
    memcpy(b, temp, size);
}

int partition(void *base, size_t count, size_t size, int (*comp)(const void*, const void*), void *pivot) {
    size_t i = 0;
    for (size_t j = 0; j < count; j++) {
        void *current = (char *)base + j * size;
        if (comp(current, pivot) < 0) {
            swap((char *)base + i * size, current, size);
            i++;
        }
    }
    swap((char *)base + i * size, pivot, size);
    return i;
}

void quicksort(void *base, size_t count, size_t size, int (*comp)(const void*, const void*)) {
    if (count < 2) return; // Base case: 0 or 1 element is already sorted

    // Choose the pivot (here we choose the last element)
    void *pivot = (char *)base + (count - 1) * size;
    int pivotIndex = partition(base, count - 1, size, comp, pivot);

    // Recursively sort the two partitions
    quicksort(base, pivotIndex, size, comp);
    quicksort((char *)base + (pivotIndex + 1) * size, count - pivotIndex - 1, size, comp);
}

void qsort(void *v, size_t count, size_t size, int (*comp)(const void*, const void*)) {
    quicksort(v, count, size, comp);
}
#endif // QSORT_IMPLEMENTATION

#endif // QSORT_H
