#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Data Analysis Utility

This module provides useful functions for data analysis.
It mainly specializes in processing and visualizing time series data.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Dict, Optional, Union, Tuple

def load_data(file_path: str, date_column: str = 'date') -> pd.DataFrame:
    """
    Load data from a CSV file and set the date index
    
    Args:
        file_path: Path to the CSV file to load
        date_column: Column name containing date information
        
    Returns:
        DataFrame with date index set
    """
    df = pd.read_csv(file_path)
    df[date_column] = pd.to_datetime(df[date_column])
    return df.set_index(date_column)

class TimeSeriesAnalysis:
    """Class for analyzing and visualizing time series data"""
    
    def __init__(self, data: pd.DataFrame):
        """
        Constructor
        
        Args:
            data: DataFrame for analysis (with date index)
        """
        self.data = data
        self.column_list = data.columns.tolist()
        
    def calculate_moving_average(self, column_name: str, window_size: int = 7) -> pd.Series:
        """
        Calculate moving average for the specified column
        
        Args:
            column_name: Target column name
            window_size: Window size for moving average
            
        Returns:
            Series of moving average values
        """
        if column_name not in self.column_list:
            raise ValueError(f"Specified column '{column_name}' does not exist in the data")
        
        return self.data[column_name].rolling(window=window_size).mean()
    
    def display_trend(self, column_name: str, title: Optional[str] = None) -> None:
        """
        Display trend graph for the specified column
        
        Args:
            column_name: Column name to display
            title: Graph title (optional)
        """
        if title is None:
            title = f"Trend analysis of {column_name}"
            
        plt.figure(figsize=(12, 6))
        plt.plot(self.data.index, self.data[column_name], label='Original Data')
        
        # Add 7-day and 30-day moving averages
        ma7 = self.calculate_moving_average(column_name, 7)
        ma30 = self.calculate_moving_average(column_name, 30)
        
        plt.plot(self.data.index, ma7, label='7-day Moving Average')
        plt.plot(self.data.index, ma30, label='30-day Moving Average')
        
        plt.title(title)
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.show()

    def detect_seasonality(self, column_name: str) -> Dict[str, float]:
        """
        Detect seasonality in time series data
        
        Args:
            column_name: Column name for analysis
            
        Returns:
            Dictionary showing strength of each period
        """
        # Simple seasonality detection using autocorrelation
        data = self.data[column_name].dropna()
        results = {}
        
        # Check daily, weekly, and monthly periodicity
        for lag, label in [(1, 'daily'), (7, 'weekly'), (30, 'monthly')]:
            if len(data) > lag * 2:
                correlation = data.autocorr(lag=lag)
                results[label] = correlation
                
        return results

# Usage example
if __name__ == "__main__":
    # Create sample data
    date_range = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    data_amount = len(date_range)
    
    # Generate data with trend + seasonality + noise
    trend = np.linspace(10, 30, data_amount)  # Upward trend
    seasonality = 5 * np.sin(np.linspace(0, 12 * np.pi, data_amount))  # Seasonal variation
    noise = np.random.normal(0, 1, data_amount)  # Random noise
    
    values = trend + seasonality + noise
    
    # Create DataFrame
    df = pd.DataFrame({
        'date': date_range,
        'sales': values
    })
    
    # Run analysis
    analysis_tool = TimeSeriesAnalysis(df.set_index('date'))
    analysis_tool.display_trend('sales', 'Time Series Analysis of Sales Data')