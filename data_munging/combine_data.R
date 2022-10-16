# -------------------------
# author: cavazd
# date  : 10/11/2022
# desc  : Code to code to combine rlcs bumpchart data
# -------------------------

# Load in tidyverse and remove and variables in environment
library(tidyverse)
rm(list=ls())

# hard coded list of regions
regions = c('na', 'eu', 'oce', 'sam', 'mena', 'apacn', 'apacs', 'ssa')

# create empty full dataframe
full_df <- data.frame()

# go through each region and combine to one region
for (i in 1:length(regions)) {
  this_df <- read.csv(
    file = paste0("../data/rlcs_", regions[i], "_ranks.csv"),
    stringsAsFactors = T,
  )
  full_df <- rbind(full_df, this_df)
} 

# write full dataframe
write.csv(
  x = full_df,
  file = paste0("../data/rlcs_all_ranks.csv"),
  row.names = F
)
