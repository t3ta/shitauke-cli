#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
データ分析ユーティリティ

このモジュールは、データ分析のための便利な関数を提供します。
主に時系列データの処理と可視化に特化しています。
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Dict, Optional, Union, Tuple

def データ読み込み(ファイルパス: str, 日付列: str = 'date') -> pd.DataFrame:
    """
    CSVファイルからデータを読み込み、日付インデックスを設定します
    
    引数:
        ファイルパス: 読み込むCSVファイルのパス
        日付列: 日付情報が含まれる列名
        
    戻り値:
        日付インデックスが設定されたDataFrame
    """
    df = pd.read_csv(ファイルパス)
    df[日付列] = pd.to_datetime(df[日付列])
    return df.set_index(日付列)

class 時系列分析:
    """時系列データの分析と可視化を行うクラス"""
    
    def __init__(self, データ: pd.DataFrame):
        """
        コンストラクタ
        
        引数:
            データ: 分析対象のDataFrame（日付インデックス付き）
        """
        self.データ = データ
        self.列名リスト = データ.columns.tolist()
        
    def 移動平均計算(self, 列名: str, ウィンドウサイズ: int = 7) -> pd.Series:
        """
        指定した列の移動平均を計算
        
        引数:
            列名: 対象の列名
            ウィンドウサイズ: 移動平均の窓サイズ
            
        戻り値:
            移動平均値のSeries
        """
        if 列名 not in self.列名リスト:
            raise ValueError(f"指定された列 '{列名}' はデータに存在しません")
        
        return self.データ[列名].rolling(window=ウィンドウサイズ).mean()
    
    def トレンド表示(self, 列名: str, タイトル: Optional[str] = None) -> None:
        """
        指定した列のトレンドをグラフ表示
        
        引数:
            列名: 表示する列名
            タイトル: グラフのタイトル（省略可）
        """
        if タイトル is None:
            タイトル = f"{列名}のトレンド分析"
            
        plt.figure(figsize=(12, 6))
        plt.plot(self.データ.index, self.データ[列名], label='元データ')
        
        # 7日と30日の移動平均を追加
        ma7 = self.移動平均計算(列名, 7)
        ma30 = self.移動平均計算(列名, 30)
        
        plt.plot(self.データ.index, ma7, label='7日移動平均')
        plt.plot(self.データ.index, ma30, label='30日移動平均')
        
        plt.title(タイトル)
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.show()

    def 季節性検出(self, 列名: str) -> Dict[str, float]:
        """
        時系列データの季節性を検出
        
        引数:
            列名: 分析対象の列名
            
        戻り値:
            各周期の強度を示す辞書
        """
        # シンプルな自己相関による季節性検出
        データ = self.データ[列名].dropna()
        結果 = {}
        
        # 日次、週次、月次の周期性をチェック
        for ラグ, ラベル in [(1, '日次'), (7, '週次'), (30, '月次')]:
            if len(データ) > ラグ * 2:
                相関 = データ.autocorr(lag=ラグ)
                結果[ラベル] = 相関
                
        return 結果

# 使用例
if __name__ == "__main__":
    # サンプルデータ作成
    日付範囲 = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    データ量 = len(日付範囲)
    
    # トレンド + 季節性 + ノイズのデータを生成
    トレンド = np.linspace(10, 30, データ量)  # 上昇トレンド
    季節性 = 5 * np.sin(np.linspace(0, 12 * np.pi, データ量))  # 季節変動
    ノイズ = np.random.normal(0, 1, データ量)  # ランダムノイズ
    
    値 = トレンド + 季節性 + ノイズ
    
    # DataFrameの作成
    df = pd.DataFrame({
        'date': 日付範囲,
        '売上': 値
    })
    
    # 分析実行
    分析ツール = 時系列分析(df.set_index('date'))
    分析ツール.トレンド表示('売上', '売上データの時系列分析')