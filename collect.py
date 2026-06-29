import os
import sys

def collect_files_content(root_folder, output_file):
    """
    Рекурсивно обходит все файлы в root_folder и сохраняет их содержимое в output_file.
    Формат: относительный путь к файлу, затем содержимое файла.
    """
    # Получаем абсолютный путь к корневой папке
    root_abs = os.path.abspath(root_folder)

    # Открываем выходной файл для записи
    with open(output_file, 'w', encoding='utf-8') as out_f:
        # Рекурсивно обходим все директории
        for dirpath, dirnames, filenames in os.walk(root_abs):
            for filename in filenames:
                # Полный путь к файлу
                file_path = os.path.join(dirpath, filename)

                # Вычисляем относительный путь от корневой папки
                rel_path = os.path.relpath(file_path, root_abs)

                # Записываем заголовок с путем
                out_f.write(f"=== Файл: {rel_path} ===\n")

                try:
                    # Пытаемся прочитать файл как текстовый
                    with open(file_path, 'r', encoding='utf-8') as in_f:
                        content = in_f.read()
                        out_f.write(content)
                except UnicodeDecodeError:
                    # Если файл бинарный - записываем сообщение об этом
                    out_f.write("[БИНАРНЫЙ ФАЙЛ - содержимое не отображается]\n")
                except Exception as e:
                    # Другие ошибки (нет доступа и т.п.)
                    out_f.write(f"[ОШИБКА ЧТЕНИЯ: {e}]\n")

                # Добавляем разделитель между файлами
                out_f.write("\n\n" + "-"*80 + "\n\n")

if __name__ == "__main__":
    # Проверяем аргументы командной строки
    if len(sys.argv) < 2:
        print("Использование: python script.py <путь_к_папке> [выходной_файл]")
        print("Пример: python script.py C:/MyProject output.txt")
        sys.exit(1)

    root_folder = sys.argv[1]

    # Выходной файл - либо из аргумента, либо по умолчанию
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        output_file = "files_content.txt"

    # Проверяем, существует ли папка
    if not os.path.exists(root_folder):
        print(f"Ошибка: папка '{root_folder}' не существует!")
        sys.exit(1)

    if not os.path.isdir(root_folder):
        print(f"Ошибка: '{root_folder}' не является папкой!")
        sys.exit(1)

    print(f"Начинаем обработку папки: {root_folder}")
    print(f"Результат будет сохранен в: {output_file}")

    collect_files_content(root_folder, output_file)

    print(f"Готово! Результат сохранен в {output_file}")