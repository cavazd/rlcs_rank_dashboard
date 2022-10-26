# -------------------------
# author: cavazd
# date  : 10/24/2022
# desc  : Code to combine seasonal rlcs data
# -------------------------

library(tidyverse)

data_dirs <- list.dirs(path = "../data", full.names = TRUE, recursive = FALSE)

full_df <- data.frame()
for (data_dir in data_dirs) {
  this_df <- read.csv(
    file = paste0(data_dir, "/rlcs_all_ranks.csv"),
    stringsAsFactors = T,
  )
  full_df <- rbind(full_df, this_df)
}

write.csv(
  x = full_df,
  file = paste0("../data/rlcs_full_ranks.csv"),
  row.names = F
)
