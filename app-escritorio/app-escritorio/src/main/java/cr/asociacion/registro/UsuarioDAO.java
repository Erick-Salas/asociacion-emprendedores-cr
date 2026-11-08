package cr.asociacion.registro;

import org.mindrot.jbcrypt.BCrypt;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class UsuarioDAO {

    public void registrar(String email, String claveProvisional, String rol) throws SQLException {
        String hash = BCrypt.hashpw(claveProvisional, BCrypt.gensalt(10));
        String sql = "INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, ?)";

        try (Connection conexion = Conexion.obtener();
             PreparedStatement ps = conexion.prepareStatement(sql)) {
            ps.setString(1, email);
            ps.setString(2, hash);
            ps.setString(3, rol);
            ps.executeUpdate();
        }
    }
}