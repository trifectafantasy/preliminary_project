db.basketball_roto_2017.update({"team":"Yosemite Yetis"}, {"h2h_rank":2, "team":"Yosemite Yetis", "FG_PCT":"0.4579", "FT_PCT":"0.7822", "THREEPM":1161, "REB":4796, "AST":2801, "STL":928, "BLK":508, "TO":1601, "PTS": 12785})
db.basketball_roto_2017.update({"team":"Team Wayne"}, {"h2h_rank":1, "team":"Team Wayne", "FG_PCT":"0.4680", "FT_PCT":"0.7984", "THREEPM":957, "REB":4932, "AST":2818, "STL":789, "BLK":460, "TO":1599, "PTS": 12768})
db.basketball_roto_2017.update({"team":"One Jrue  Brow"}, {"h2h_rank":6, "team":"One Jrue  Brow", "FG_PCT":"0.4546", "FT_PCT":"0.8021", "THREEPM":971, "REB":4500, "AST":2583, "STL":799, "BLK":569, "TO":1490, "PTS": 12006})
db.basketball_roto_2017.update({"team":"OH NICK CONTROVERSIAL"}, {"h2h_rank":3, "team":"OH NICK CONTROVERSIAL", "FG_PCT":"0.4770", "FT_PCT":"0.7426", "THREEPM":946, "REB":4646, "AST":2302, "STL":855, "BLK":539, "TO":1391, "PTS": 11693})
db.basketball_roto_2017.update({"team":"King James and His Royal Court"}, {"h2h_rank":4, "team":"King James and His Royal Court", "FG_PCT":"0.4759", "FT_PCT":"0.7398", "THREEPM":1157, "REB":4908, "AST":2661, "STL":726, "BLK":499, "TO":1479, "PTS": 11978})
db.basketball_roto_2017.update({"team":"Hardened Wangs"}, {"h2h_rank":8, "team":"Hardened Wangs", "FG_PCT":"0.4669", "FT_PCT":"0.8066", "THREEPM":1009, "REB":4476, "AST":2698, "STL":731, "BLK":334, "TO":1549, "PTS": 12618})
db.basketball_roto_2017.update({"team":"We Wiggin for Myles and Myles"}, {"h2h_rank":5, "team":"We Wiggin for Myles and Myles", "FG_PCT":"0.4679", "FT_PCT":"0.7816", "THREEPM":844, "REB":4110, "AST":2513, "STL":849, "BLK":622, "TO":1429, "PTS": 11555})
db.basketball_roto_2017.update({"team":"An Injury Wait ing to Happen"}, {"h2h_rank":7, "team":"An Injury Wait ing to Happen", "FG_PCT":"0.4688", "FT_PCT":"0.8219", "THREEPM":838, "REB":4078, "AST":2475, "STL":747, "BLK":507, "TO":1467, "PTS": 11217})
db.basketball_roto_2017.update({"team":"Team Fong"}, {"h2h_rank":10, "team":"Team Fong", "FG_PCT":"0.4644", "FT_PCT":"0.7891", "THREEPM":965, "REB":3932, "AST":2047, "STL":609, "BLK":432, "TO":1312, "PTS": 10999})
db.basketball_roto_2017.update({"team":"Team Aguirre"}, {"h2h_rank":9, "team":"Team Aguirre", "FG_PCT":"0.4487", "FT_PCT":"0.7995", "THREEPM":883, "REB":3805, "AST":2216, "STL":681, "BLK":395, "TO":1324, "PTS": 10382})

db.basketball_h2h_2017.insert({"team":"Yosemite Yetis", "wins":89, "losses":69, "ties":4, "win_per":"0.562", "division":"EVENS", "h2h_trifecta_points": 9})

db.basketball_h2h_2017.update({"h2h_trifecta_points":2},{"$set":{"h2h_trifecta_points":1}})
db.basketball_h2h_2017.update({"h2h_trifecta_points":3},{"$set":{"h2h_trifecta_points":2}})
db.basketball_h2h_2017.update({"h2h_trifecta_points":4},{"$set":{"h2h_trifecta_points":3}})
db.basketball_h2h_2017.update({"h2h_trifecta_points":5},{"$set":{"h2h_trifecta_points":4}})
db.basketball_h2h_2017.update({"h2h_trifecta_points":6},{"$set":{"h2h_trifecta_points":5}})
db.basketball_h2h_2017.update({"h2h_trifecta_points":7},{"$set":{"h2h_trifecta_points":6}})
db.basketball_h2h_2017.update({"h2h_trifecta_points":8},{"$set":{"h2h_trifecta_points":7}})
db.basketball_h2h_2017.update({"team":"OH NICK CONTROVERSIAL"},{"$set":{"h2h_trifecta_points":8}})