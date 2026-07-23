import os
import re
import shutil
import json
import pandas as pd
from io import StringIO
import chardet
import time
import argparse


# ------------------- 文件读取函数 -------------------
def read_file_lines(file_path, skip_first=True, skip_last=True):
    with open(file_path, "rb") as f:
        raw_data = f.read(2000)
        result = chardet.detect(raw_data)
        encoding = result["encoding"] or "gbk"

    with open(file_path, "r", encoding=encoding, errors="ignore") as f:
        lines = f.readlines()

    if skip_first:
        lines = lines[1:]
    if skip_last:
        lines = lines[:-1]

    return lines, encoding


def read_first_line(file_path):
    with open(file_path, "rb") as f:
        raw_data = f.read(2000)
        result = chardet.detect(raw_data)
        encoding = result["encoding"] or "gbk"

    with open(file_path, "r", encoding=encoding, errors="ignore") as f:
        first_line = f.readline().strip()

    return first_line, encoding


# ------------------- 日线处理 -------------------
def process_daily_csv(file_path, output_dir):
    lines, encoding = read_file_lines(file_path, skip_first=True, skip_last=True)

    header = ["trade_date", "open", "high", "low", "close", "vol", "amount"]
    data = []

    for line in lines:
        parts = line.strip().split(",")
        if len(parts) < 7:
            continue
        trade_date = parts[0].replace("/", "")
        row = [trade_date] + parts[1:]
        data.append(row)

    df = pd.DataFrame(data, columns=header)

    # ts_code
    file_name = os.path.basename(file_path)
    mkt, code_ext = file_name.split("#")
    code = code_ext.split(".")[0]
    ts_code = f"{code}.{mkt}"
    df.insert(0, "ts_code", ts_code)

    # 计算 pre_close, change, pct_chg
    df["close"] = df["close"].astype(float)
    df["pre_close"] = df["close"].shift(1)
    df["change"] = df["close"] - df["pre_close"]
    df["pct_chg"] = df["change"] / df["pre_close"] * 100

    # 列顺序
    df = df[
        [
            "ts_code",
            "trade_date",
            "open",
            "high",
            "low",
            "close",
            "pre_close",
            "change",
            "pct_chg",
            "vol",
            "amount",
        ]
    ]

    # 倒序
    df = df.iloc[::-1]

    # 输出文件名
    new_file_name = f"{code}.{mkt}_raw.csv"
    output_file = os.path.join(output_dir, new_file_name)
    df.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"✅ 日线文件已处理：{output_file}")


# ------------------- 分钟线处理 -------------------
def process_minute_csv(file_path, output_dir, period=None):
    lines, encoding = read_file_lines(file_path, skip_first=True, skip_last=True)

    header = ["timestamps", "open", "high", "low", "close", "vol", "amount"]
    data = []

    for line in lines:
        parts = line.strip().split(",")
        if len(parts) < 7:
            continue
        date_str, time_str = parts[0], parts[1]
        timestamps = f"{date_str.replace('/', '-') } {time_str[:2]}:{time_str[2:]}:00"
        row = [timestamps] + parts[2:]
        data.append(row)

    df = pd.DataFrame(data, columns=header)

    # 输出文件名
    file_name = os.path.basename(file_path)
    mkt, code_ext = file_name.split("#")
    code = code_ext.split(".")[0]

    # 如果 period 未提供，则从首行解析
    if not period:
        with open(file_path, "r", encoding=encoding, errors="ignore") as f:
            first_line = f.readline()
        period = "1min"
        for tdx_str, std_str in [
            ("1分钟线", "1min"),
            ("5分钟线", "5min"),
            ("15分钟线", "15min"),
            ("30分钟线", "30min"),
            ("60分钟线", "60min"),
        ]:
            if tdx_str in first_line:
                period = std_str
                break

    new_file_name = f"{mkt}_{code}_{period}.csv"
    output_file = os.path.join(output_dir, new_file_name)
    df.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"✅ 分钟线文件已处理：{output_file}")


# ------------------- 主函数 -------------------
def main():
    start_time = time.time()

    parser = argparse.ArgumentParser(description="处理股票 CSV 文件")
    parser.add_argument("-d", "--daily", action="store_true", help="处理日线文件")
    parser.add_argument("-m", "--minute", action="store_true", help="处理分钟线文件")
    args = parser.parse_args()

    process_daily = args.daily or not (args.daily or args.minute)
    process_minute = args.minute or not (args.daily or args.minute)

    # 读取配置
    with open("config.json", "r", encoding="utf-8") as f:
        config = json.load(f)

    input_dir = config["input_dir"]
    daily_output_dir = config["output_dir"]["daily"]
    min_output_dir = config["output_dir"]["min"]

    # 清空输出目录
    if process_daily and os.path.exists(daily_output_dir):
        shutil.rmtree(daily_output_dir)
        os.makedirs(daily_output_dir, exist_ok=True)
    if process_minute and os.path.exists(min_output_dir):
        shutil.rmtree(min_output_dir)
        os.makedirs(min_output_dir, exist_ok=True)

    # 遍历目录
    for root, _, files in os.walk(input_dir):
        for file in files:
            if not file.endswith(".csv"):
                continue
            file_path = os.path.join(root, file)
            first_line, encoding = read_first_line(file_path)

            if process_daily and "日线" in first_line:
                process_daily_csv(file_path, daily_output_dir)
            elif process_minute and "分钟线" in first_line:
                # 提取周期
                m = re.search(r"(\d+)分钟线", first_line)
                period = f"{m.group(1)}min" if m else "1min"
                process_minute_csv(file_path, min_output_dir, period)

    end_time = time.time()
    elapsed = end_time - start_time
    print(f"\n🕒 程序运行完成，总耗时: {elapsed:.2f} 秒")


if __name__ == "__main__":
    main()
# 运行脚本前，请确保当前目录下有 config.json 文件，内容示例：
# {
#   "input_dir": "E:/datasets",
#   "output_dir": {
#     "daily": "F:/NeuralNetwork/Data_src/api/data",
#     "min": "./data/min"
#   }
# }
