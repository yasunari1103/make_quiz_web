#include <stdlib.h>
#include <stdio.h>
#include <time.h>

int get_random_in_range(int level) {
    return (rand() % level) + 1;
}

// 出力バッファに結果を書き込む形式（JS側から呼ばれる）
void make_quiz(int level, int count, char *out, int maxlen) {
    srand(time(NULL));
    int written = 0;

    for (int i = 0; i < count && written < maxlen - 1; i++) {
        int a = get_random_in_range(level);
        int b = get_random_in_range(level);
        if (rand() % 2) a = -a;
        if (rand() % 2) b = -b;

        int A = a + b;
        int B = a * b;

        // 形式: x² + Ax + B = (x + a)(x + b)
        written += snprintf(out + written, maxlen - written,
            "x² %c %d x %c %d = (x %c %d)(x %c %d)\n",
            A >= 0 ? '+' : '-', abs(A),
            B >= 0 ? '+' : '-', abs(B),
            a >= 0 ? '+' : '-', abs(a),
            b >= 0 ? '+' : '-', abs(b)
        );
    }
}
